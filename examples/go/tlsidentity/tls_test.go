package tlsidentity

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"math/big"
	"net"
	"testing"
	"time"
)

func TestIdentityAndALPN(t *testing.T) {
	now := time.Now()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	rootTemplate := &x509.Certificate{SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "课程测试 CA"}, NotBefore: now.Add(-time.Hour), NotAfter: now.Add(time.Hour), IsCA: true, BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign}
	rootDER, err := x509.CreateCertificate(rand.Reader, rootTemplate, rootTemplate, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	root, err := x509.ParseCertificate(rootDER)
	if err != nil {
		t.Fatal(err)
	}
	leaf := &x509.Certificate{SerialNumber: big.NewInt(2), DNSNames: []string{"api.example.test"}, NotBefore: now.Add(-time.Hour), NotAfter: now.Add(time.Hour), KeyUsage: x509.KeyUsageDigitalSignature, ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}}
	der, err := x509.CreateCertificate(rand.Reader, leaf, root, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	roots := x509.NewCertPool()
	roots.AddCert(root)
	for _, tc := range []struct {
		name   string
		change func(*tls.Config)
		wantOK bool
	}{
		{"可信名字与协议", func(c *tls.Config) {}, true},
		{"名字不匹配", func(c *tls.Config) { c.ServerName = "other.example.test" }, false},
		{"缺少信任根", func(c *tls.Config) { c.RootCAs = x509.NewCertPool() }, false},
		{"证书已过期", func(c *tls.Config) { c.Time = func() time.Time { return now.Add(2 * time.Hour) } }, false},
		{"协议不相交", func(c *tls.Config) { c.NextProtos = []string{"unmatched"} }, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			listener, err := net.Listen("tcp4", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			if err = listener.(*net.TCPListener).SetDeadline(time.Now().Add(3 * time.Second)); err != nil {
				t.Fatal(err)
			}
			done := make(chan error, 1)
			go func() {
				raw, err := listener.Accept()
				if err != nil {
					done <- err
					return
				}
				defer raw.Close()
				conn := tls.Server(raw, &tls.Config{MinVersion: tls.VersionTLS13, Certificates: []tls.Certificate{{Certificate: [][]byte{der}, PrivateKey: key}}, NextProtos: []string{"h2"}})
				ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				defer cancel()
				done <- conn.HandshakeContext(ctx)
			}()
			config := &tls.Config{MinVersion: tls.VersionTLS13, RootCAs: roots, ServerName: "api.example.test", NextProtos: []string{"h2"}}
			tc.change(config)
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			conn, err := (&tls.Dialer{Config: config}).DialContext(ctx, "tcp4", listener.Addr().String())
			if tc.wantOK {
				if err != nil {
					t.Fatal(err)
				}
				state := conn.(*tls.Conn).ConnectionState()
				conn.Close()
				if state.Version != tls.VersionTLS13 || state.NegotiatedProtocol != "h2" || len(state.VerifiedChains) == 0 {
					t.Fatal("握手状态不符合预期")
				}
			} else {
				if conn != nil {
					conn.Close()
				}
				if err == nil {
					t.Fatal("应拒绝无效身份或协议")
				}
			}
			select {
			case serverErr := <-done:
				if tc.wantOK && serverErr != nil {
					t.Fatal(serverErr)
				}
			case <-time.After(3 * time.Second):
				t.Fatal("服务端握手未退出")
			}
		})
	}
}

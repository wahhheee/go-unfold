export type TlsConfig = { trust: boolean; name: boolean; valid: boolean; alpn: boolean };
export function tlsView(c: TlsConfig, step: number) {
  const failure = !c.alpn
    ? '没有共同 ALPN 协议'
    : !c.trust
      ? '证书链无法连接到信任根'
      : !c.name
        ? '证书中的服务名字不匹配'
        : !c.valid
          ? '证书不在有效期内'
          : null;
  const failedAt = !c.alpn ? 2 : 3;
  const failed = !!failure && step >= failedAt;
  const actual = failed ? failedAt : step;
  const labels = [
    '准备 TCP 连接',
    'ClientHello → 名字、算法与协议候选',
    '← ServerHello 与加密握手消息',
    '验证证书链、服务名字与握手证明',
    '双方 Finished → 可交换应用数据',
  ];
  return {
    actual,
    failed,
    complete: !failed && step === 4,
    failure: failed ? failure : null,
    labels,
    message: failed
      ? `握手停止：${failure}。修复信任、名字、时间或协议配置，不靠跳过验证消除错误。`
      : step === 4
        ? 'TLS 1.3 握手完成，选择 h2；证明对端符合本次验证规则，不等于用户已获业务权限。'
        : labels[actual],
  };
}

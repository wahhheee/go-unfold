import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export function NotFound() {
  return (
    <main className="standalone-page empty-state" id="main-content">
      <span className="not-found-code">404</span>
      <h1>这一页还没有写到。</h1>
      <p>已发布的内容，都可以在学习路径中找到。</p>
      <Link className="button" to="/learn/preface">
        <ArrowLeft size={16} />
        回到序章
      </Link>
      <Link className="text-button" to="/roadmap">
        查看知识地图
        <ArrowUpRight size={15} />
      </Link>
    </main>
  );
}

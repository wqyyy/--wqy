import { useNavigate } from "react-router-dom";
import "./PolicyOverview.css";

export function PolicyOverview() {
  const navigate = useNavigate();
  return (
    <section className="policy-panorama" aria-label="首页">
      <div className="policy-panorama-scene">
        <img className="policy-panorama-reference" src={`${import.meta.env.BASE_URL}policy-overview-reference.png`} alt="惠企政策大脑，AI盾牌连接政策制定、政策触达、政策兑现和政策评价模块" />
        <h1 className="sr-only">首页</h1>
        <div className="policy-panorama-back-mask" aria-hidden="true" />
        {[{ label: '政策起草', value: '115', unit: '篇' }, { label: '政策触达', value: '109239', unit: '次' }, { label: '兑现事项', value: '600', unit: '项' }, { label: '评价报告', value: '102', unit: '篇' }].map((stat, index) => (
          <div key={stat.label} className="policy-panorama-stat" style={{ left: `${23.8 + index * 15.55}%` }}><h2>{stat.label}</h2><p><strong>{stat.value}</strong><span>{stat.unit}</span></p></div>
        ))}
        {[{ title: '政策制定', path: '/policy-writing', position: 'writing' }, { title: '政策触达', path: '/policy-reach', position: 'reach' }, { title: '政策兑现', path: '/dashboard', position: 'redeem' }, { title: '政策评价', path: '/policy-evaluation', position: 'evaluation' }].map(module => (
          <button key={module.title} className={`policy-panorama-link policy-panorama-${module.position}`} onClick={() => navigate(module.path)} aria-label={`进入${module.title}`} />
        ))}
        <div className="policy-panorama-resources">
          {[{ title: '基础政策库', value: '6', unit: '万篇' }, { title: '政策工具箱', value: '3.2', unit: '万条' }, { title: '专家知识库', value: '2046', unit: '条' }].map(resource => (
            <div className="policy-panorama-resource" key={resource.title}><h2>{resource.title}</h2><p><strong>{resource.value}</strong><span>{resource.unit}</span></p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

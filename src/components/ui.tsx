export function Button({children,className="",...props}:React.ButtonHTMLAttributes<HTMLButtonElement>){return <button className={`button ${className}`} {...props}>{children}</button>}
export function Card({children,className=""}:{children:React.ReactNode;className?:string}){return <section className={`card ${className}`}>{children}</section>}
export function Badge({children,tone="neutral"}:{children:React.ReactNode;tone?:"good"|"warn"|"neutral"}){return <span className={`badge ${tone}`}>{children}</span>}
export function Loading({text="Carregando..."}:{text?:string}){return <div className="loading">{text}</div>}
export function Empty({children}:{children:React.ReactNode}){return <div className="empty">{children}</div>}
export function PageTitle({eyebrow,title,detail,action}:{eyebrow:string;title:string;detail?:string;action?:React.ReactNode}){return <header><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{detail&&<p>{detail}</p>}</div>{action}</header>}

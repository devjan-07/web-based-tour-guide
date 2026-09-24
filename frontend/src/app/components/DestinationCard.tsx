import { useState } from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import { motion } from "motion/react";

interface DestinationCardProps { id:number; image:string; title:string; location:string; badge?:string; tags?:string[]; onView?:(id:number,title:string)=>void; }

export function DestinationCard({id,image,title,location,badge,tags=[],onView}:DestinationCardProps){
 const [liked,setLiked]=useState(false); const [imgError,setImgError]=useState(false);
 return <motion.article whileHover={{y:-6}} transition={{duration:.25}} onClick={()=>onView?.(id,title)} className="group cursor-pointer">
   <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-200 aspect-[4/5] shadow-[0_18px_50px_rgba(18,55,47,.10)]">
    <img src={imgError?"https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=900":image} alt={title} onError={()=>setImgError(true)} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"/>
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent"/>
    <div className="absolute left-4 right-4 top-4 flex items-center justify-between"><span className="rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-white backdrop-blur-md">{badge||"Sri Lanka"}</span><button aria-label={liked?"Remove saved place":"Save place"} onClick={e=>{e.stopPropagation();setLiked(v=>!v)}} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white backdrop-blur-md transition hover:bg-white hover:text-[#12372f]"><Heart className="h-4 w-4" fill={liked?"currentColor":"none"}/></button></div>
    <div className="absolute inset-x-5 bottom-5 text-white"><div className="flex flex-wrap gap-1.5">{tags.slice(0,2).map(tag=><span key={tag} className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium backdrop-blur-md">{tag}</span>)}</div><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-xs text-white/65">{location}</p><h3 className="mt-1 text-2xl font-semibold tracking-[-.03em]">{title}</h3></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#12372f] transition-transform group-hover:rotate-45"><ArrowUpRight className="h-4 w-4"/></span></div></div>
   </div>
 </motion.article>;
}
import {addDays,weekday,difference} from './time.js';
export const COURSE_VERSION=3;
export const COURSE_DAYS=90;
export const foundations=['Inputs and returned answers','Values have types','Choose with if and else','Trace one step at a time','A loop repeats work','Keep a running total'];
const reflection='Which part can you do without help, and which part needs another small try?';
export function makePlan(questions,settings){
 const sessions=questions.flatMap(q=>(q.sessions||[]).map(learning=>({q,learning}))).sort((a,b)=>a.learning.day-b.learning.day);
 const days=Array.from({length:COURSE_DAYS},(_,i)=>{
  const number=i+1,date=addDays(settings.start,i),entry=sessions.find(s=>s.learning.day===number),prior=sessions.filter(s=>s.learning.day<number),last=prior.at(-1);
  const light=number%7===0;
  const learning=entry?.learning||{title:'Make this week stick',text:'No new topic today. Choose one exercise from this week that needed help. Try it with notes closed, compare with your earlier version, and repair one small mistake. If it is still unclear, repeat this week before continuing.',example:'Try → check a small input → find the first wrong step → repair → retry without notes.',tiny:'Choose one exercise from this week. Write a tiny input and its expected answer, then check your code on it.',feedback:'Compare your prediction with the output. If they differ, trace the first step where the values disagree. Explain that correction in your own words.',recall:number===7?'What does return do?':number===14?'What is the last valid position in an array of length 3?':'Name one useful idea from this week without opening your notes.',reflection,week:last?.learning.week||'Restart',day:number,mixed:number>=85};
  // Actual logged attempts retain the existing adaptive review engine. These are bounded transfer prompts, not extra first attempts.
  const candidates=[1,3,7,21].map(gap=>sessions.find(s=>s.learning.day===number-gap)).filter(Boolean);
  const source=candidates.length?candidates[(number-1)%candidates.length]:null;
  const transfer=source?{question:source.q.id,fromDay:source.learning.day,prompt:[`For “${source.q.title}”, give one small input and predict its answer without notes.`,`For “${source.q.title}”, change one input in its example. Predict the answer before checking.`,`For “${source.q.title}”, try an empty input if allowed, or the smallest allowed input. What should happen?`,`For “${source.q.title}”, explain the approach from memory and one situation where you must be careful.`][number%4]}:null;
  const q=entry?.q,capacity=Math.max(0,Number(settings.capacity[weekday(date)])||0),newMinutes=q?q.estimate:0;
  const reviewMinutes=light?25:number<=14?10:15,lessonMinutes=light?5:10,tinyMinutes=5,recallMinutes=3,reflectionMinutes=2;
  const total=newMinutes+reviewMinutes+lessonMinutes+tinyMinutes+recallMinutes+reflectionMinutes;
  return {date,number,capacity,questions:q?[q.id]:[],lesson:learning.title,learning,courseVersion:COURSE_VERSION,courseDay:number,mock:false,light,transfer,newMinutes,reviewMinutes,lessonMinutes,tinyMinutes,recallMinutes,reflectionMinutes,total,overflow:Math.max(0,total-capacity),repeat:!!q&&q.sessions[0].day<number};
 });
 return days;
}
export function catchUp(plan,questions,state,today){
 // Course units are self-paced. Dates are targets only; preserve unit identity and saved entries.
 if(!plan.some(d=>d.courseVersion===COURSE_VERSION))return {days:[],unresolved:[...new Set(plan.flatMap(d=>d.questions))].filter(id=>!state.attempts.some(a=>a.question===id))};
 const map=new Map(questions.map(q=>[q.id,q]));
 const firstUnits=[...new Map(plan.filter(d=>d.courseDay<85&&!d.light&&!d.repeat&&d.questions.length).map(d=>[d.questions[0],d])).values()];
 const pending=firstUnits.filter(d=>d.questions.some(id=>!state.attempts.some(a=>a.question===id)));
 const extra=(state.backlog||[]).filter(id=>!pending.some(d=>d.questions.includes(id))&&!state.attempts.some(a=>a.question===id));
 for(const id of extra){const q=map.get(id);if(q?.sessions?.length){const unit=makePlan(questions,state.settings).find(d=>d.questions.includes(id));if(unit)pending.push(unit);}}
 pending.sort((a,b)=>a.courseDay-b.courseDay);
 const dates=plan.filter(d=>d.date>=today&&d.number<85&&!d.light&&!state.pauses?.[d.date]);
 let cursor=0;const days=dates.map(d=>({...d,assigned:[],free:Math.max(0,d.capacity-d.reviewMinutes-20)}));
 for(const d of days){const unit=pending[cursor];if(!unit)break;if(unit.total>d.capacity)continue;d.assigned=[...unit.questions];d.unit=unit;d.free=d.capacity-unit.total;cursor++;}
 return {days,unresolved:pending.slice(cursor).flatMap(d=>d.questions)};
}
export const planDay=(settings,today)=>difference(today,settings.start)+1;

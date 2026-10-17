const religiousChoices = new Set();
const religiousCache = new Map();
const traditionNames = {christian: 'Christian (Western)', jewish: 'Jewish (diaspora)', islamic: 'Islamic (estimated)'};
try {
  const saved = JSON.parse(localStorage.getItem('trottola-religious-holidays') || '[]');
  if (Array.isArray(saved)) saved.forEach(choice => { if (traditionNames[choice]) religiousChoices.add(choice); });
} catch {}
function religiousHolidays(year) {
  if (religiousCache.has(year)) return religiousCache.get(year);
  const result = new Map();
  const add = (date, name) => {
    const key = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()].join('-');
    result.set(key, [...(result.get(key) || []), name]);
  };
  if (religiousChoices.has('christian')) {
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    const month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
    const easter=new Date(Date.UTC(year,month-1,day));
    [[-46,'Ash Wednesday'],[-7,'Palm Sunday'],[-2,'Good Friday'],[0,'Easter Sunday'],[1,'Easter Monday'],[39,'Ascension Day'],[49,'Pentecost']].forEach(([offset,name])=>add(new Date(easter.getTime()+offset*86400000),name));
    add(new Date(Date.UTC(year,0,6)), 'Epiphany');
    add(new Date(Date.UTC(year,11,24)), 'Christmas Eve');
    add(new Date(Date.UTC(year,11,25)), 'Christmas Day · Christian');
  }
  for (const [choice, calendar] of [['jewish','hebrew'],['islamic','islamic-umalqura']]) {
    if (!religiousChoices.has(choice)) continue;
    const formatter=new Intl.DateTimeFormat('en-u-ca-'+calendar,{month:'long',day:'numeric',timeZone:'UTC'});
    for (let date=new Date(Date.UTC(year,0,1));date.getUTCFullYear()===year;date.setUTCDate(date.getUTCDate()+1)) {
      const parts=Object.fromEntries(formatter.formatToParts(date).map(p=>[p.type,p.value]));
      const day=Number(parts.day),month=parts.month;
      let name='';
      if(choice==='jewish') {
        if(month==='Tishri'&&day<=2) name='Rosh Hashanah';
        if(month==='Tishri'&&day===10) name='Yom Kippur';
        if(month==='Tishri'&&day>=15&&day<=21) name='Sukkot';
        if(month==='Tishri'&&day===22) name='Shemini Atzeret';
        if(month==='Tishri'&&day===23) name='Simchat Torah';
        if(month==='Nisan'&&day>=15&&day<=22) name='Passover';
        if(month==='Sivan'&&(day===6||day===7)) name='Shavuot';
        if((month==='Adar'||month==='Adar II')&&day===14) name='Purim';
        // Hanukkah spans eight days, including variable-length Kislev.
        for(let back=0;back<8;back++) {
          const earlier=Object.fromEntries(formatter.formatToParts(new Date(date.getTime()-back*86400000)).map(p=>[p.type,p.value]));
          if(earlier.month==='Kislev'&&Number(earlier.day)===25) name='Hanukkah';
        }
      } else {
        if(month==='Ramadan'&&day===1) name='Ramadan begins (estimated)';
        if(month==='Shawwal'&&day<=3) name='Eid al-Fitr (estimated)';
        if(month==='Dhuʻl-Hijjah'&&day>=10&&day<=13) name='Eid al-Adha (estimated)';
        if(month==='Muharram'&&day===1) name='Islamic New Year (estimated)';
        if(month==='Muharram'&&day===10) name='Ashura (estimated)';
      }
      if(name) add(date,name);
    }
  }
  religiousCache.set(year,result);
  return result;
}
function religiousStatus(message='') {
  document.querySelector('#religious-status').textContent=(religiousChoices.size ? 'Added: '+[...religiousChoices].map(c=>traditionNames[c]).join(', ')+'.' : 'Choose a tradition to add its main holidays across all three years.')+' '+message;
}
function saveReligiousChoices() {
  religiousCache.clear();
  let message='';
  try {localStorage.setItem('trottola-religious-holidays',JSON.stringify([...religiousChoices]));} catch {message='Saving is unavailable; this selection lasts for this visit.';}
  renderYear();religiousStatus(message);
}
document.querySelector('#add-religious-holidays').addEventListener('click',()=>{religiousChoices.add(document.querySelector('#religious-tradition').value);saveReligiousChoices();});
document.querySelector('#clear-religious-holidays').addEventListener('click',()=>{religiousChoices.clear();saveReligiousChoices();});
religiousStatus();

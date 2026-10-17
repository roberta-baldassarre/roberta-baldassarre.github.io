(() => {
  const form = document.querySelector('#trip-event-form');
  const status = document.querySelector('#trip-event-status');
  const sync = document.querySelector('#trip-event-sync');
  let latest = null;
  const field = name => form.elements.namedItem(name);
  const date = value => new Date(value + 'T00:00:00Z');
  const compact = value => value.replaceAll('-', '');
  const iso = value => value.toISOString().slice(0, 10);
  document.querySelector('#open-event-form').addEventListener('click', () => {
    form.hidden = false;
    field('title').focus();
  });
  document.querySelector('#cancel-event-form').addEventListener('click', () => { form.hidden = true; });
  field('start').addEventListener('change', () => {
    field('end').min = field('start').value || '1900-01-01';
    if (!field('end').value || field('end').value < field('start').value) field('end').value = field('start').value;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const title = field('title').value.trim();
    const start = date(field('start').value), end = date(field('end').value);
    if (!title || !Number.isFinite(+start) || !Number.isFinite(+end) || end < start || (end - start) / 86400000 > 369) {
      status.textContent = 'Enter an event name and a date range of up to 370 days, ending on or after the start date.';
      return;
    }
    const location = field('location').value.trim();
    const reminder = field('reminder').value === 'yes';
    const eventData = {id: crypto.randomUUID(), title, start: iso(start), end: iso(end), location, reminder};
    const label = title + (location ? ' · ' + location : '');
    const combined = {...importedCalendar};
    for (let day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
      const key = [day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()].join('-');
      combined[key] = [...new Set([...(combined[key] || []), label])];
    }
    try {
      // Keep event details for calendar export as well as the visible daily labels.
      const saved = JSON.parse(localStorage.getItem('trottola-trip-events') || '[]');
      localStorage.setItem('trottola-trip-events', JSON.stringify([...(Array.isArray(saved) ? saved : []), eventData]));
      localStorage.setItem('trottola-imported-calendar', JSON.stringify(combined));
    } catch {
      status.textContent = 'Saving is unavailable. Your event has not been added; try again when browser storage is available.';
      return;
    }
    importedCalendar = combined;
    latest = eventData;
    const exclusiveEnd = new Date(end.getTime() + 86400000);
    const url = new URL('https://calendar.google.com/calendar/render');
    url.search = new URLSearchParams({action:'TEMPLATE',text:title,dates:compact(iso(start))+'/'+compact(iso(exclusiveEnd)),location,details:reminder ? 'Email reminder requested: enable an email notification in this event’s notification settings before saving.' : ''}).toString();
    document.querySelector('#trip-event-google').href = url.href;
    sync.hidden = false;
    form.hidden = true;
    yearInput.value = Math.min(2099, start.getUTCFullYear());
    renderYear();
    status.textContent = 'Event saved from ' + eventData.start + ' through ' + eventData.end + '.' + (reminder ? ' Email reminder requested: choose an email notification in your calendar after adding it. No reminder email has been scheduled by this page.' : ' No email reminder requested.');
  });
  const escapeICS = value => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  document.querySelector('#trip-event-apple').addEventListener('click', () => {
    if (!latest) return;
    const end = date(latest.end); end.setUTCDate(end.getUTCDate() + 1);
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//La Trottola//Trip Planner//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+latest.id+'@la-trottola','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART;VALUE=DATE:'+compact(latest.start),'DTEND;VALUE=DATE:'+compact(iso(end)),'SUMMARY:'+escapeICS(latest.title),'LOCATION:'+escapeICS(latest.location),'DESCRIPTION:'+escapeICS(latest.reminder ? 'Email reminder requested. Enable an email notification with your calendar provider; this file does not schedule email.' : 'Added with La Trottola trip planner.'),'END:VEVENT','END:VCALENDAR'];
    const blob = new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'trip-event.ics'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();

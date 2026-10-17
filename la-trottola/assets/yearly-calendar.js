// Nationwide federal holiday rules; source: OPM federal holiday calendar.
function federalHolidays(year) {
  const holidays = new Map();
  const key = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
  const add = (date, name) => holidays.set(key(date), [...(holidays.get(key(date)) || []), name]);
  const nthMonday = (month, nth) => new Date(year, month, 1 + (8 - new Date(year, month, 1).getDay()) % 7 + 7 * (nth - 1));
  const fixed = (y, month, day, name) => {
    const date = new Date(y, month, day);
    add(date, name);
    if (date.getDay() === 6 || date.getDay() === 0) {
      const observed = new Date(y, month, day + (date.getDay() === 6 ? -1 : 1));
      add(observed, name + ' (observed)');
    }
  };
  // Include adjacent years for New Year's observed across a year boundary.
  for (let y = year - 1; y <= year + 1; y++) {
    fixed(y, 0, 1, "New Year’s Day");
    if (y >= 2021) fixed(y, 5, 19, 'Juneteenth');
    fixed(y, 6, 4, 'Independence Day');
    fixed(y, 10, 11, 'Veterans Day');
    fixed(y, 11, 25, 'Christmas Day');
  }
  if (year >= 1986) add(nthMonday(0, 3), 'Martin Luther King Jr. Day');
  add(nthMonday(1, 3), 'Washington’s Birthday / Presidents’ Day');
  const mayEnd = new Date(year, 4, 31);
  add(new Date(year, 4, 31 - (mayEnd.getDay() + 6) % 7), 'Memorial Day');
  add(nthMonday(8, 1), 'Labor Day');
  add(nthMonday(9, 2), 'Columbus Day');
  add(new Date(year, 10, 1 + (11 - new Date(year, 10, 1).getDay()) % 7 + 21), 'Thanksgiving Day');
  return holidays;
}
let importedCalendar = {};
try { const saved = JSON.parse(localStorage.getItem('trottola-imported-calendar') || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) importedCalendar = saved; } catch {}
const yearInput = document.querySelector('#calendar-year');
const calendar = document.querySelector('#yearly-calendar');
const calendarStatus = document.querySelector('#calendar-status');
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
yearInput.value = new Date().getFullYear();
function renderYear() {
  const year = Number(yearInput.value);
  if (!Number.isInteger(year) || year < 1900 || year > 2098) { yearInput.reportValidity(); return; }
  calendar.replaceChildren();
  for (let displayedYear = year; displayedYear < year + 3; displayedYear++) {
    const yearColumn = document.createElement('section');
    yearColumn.className = 'calendar-year-column';
    const yearHeading = document.createElement('h2');
    yearHeading.className = 'calendar-year-heading';
    yearHeading.id = 'calendar-heading-' + displayedYear;
    yearHeading.textContent = displayedYear;
    yearColumn.setAttribute('aria-labelledby', yearHeading.id);
    yearColumn.append(yearHeading);
    calendar.append(yearColumn);
    const year = displayedYear;
    const holidays = federalHolidays(year);
    const religious = religiousHolidays(year);
    months.forEach((month, index) => {
    const section = document.createElement('section');
    section.className = 'calendar-month';
    section.style.padding = '0';
    const heading = document.createElement('h3');
    heading.textContent = month + ' ' + year;
    section.append(heading);
    const grid = document.createElement('div');
    grid.className = 'month-grid';
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(day => {
      const label = document.createElement('div'); label.className = 'weekday'; label.textContent = day; grid.append(label);
    });
    const offset = (new Date(year, index, 1).getDay() + 6) % 7;
    const count = new Date(year, index + 1, 0).getDate();
    for (let cell = 0; cell < Math.ceil((offset + count) / 7) * 7; cell++) {
      const day = cell - offset + 1;
      if (day < 1 || day > count) { const blank = document.createElement('div'); blank.className = 'calendar-blank'; grid.append(blank); continue; }
      const label = document.createElement('label'); label.className = 'calendar-day';
      const number = document.createElement('span'); number.textContent = day;
      const note = document.createElement('textarea');
      note.setAttribute('aria-label', month + ' ' + day + ', ' + year + ' trip notes');
      const key = 'trottola-calendar-' + year + '-' + (index + 1) + '-' + day;
      try { note.value = localStorage.getItem(key) || ''; } catch { calendarStatus.textContent = 'Saving is unavailable. Notes last for this view only; print before changing years or leaving.'; }
      note.addEventListener('input', () => {
        try { if (note.value) localStorage.setItem(key, note.value); else localStorage.removeItem(key); }
        catch { calendarStatus.textContent = 'Your latest notes could not be saved. Print before changing years or leaving.'; }
      });
      label.append(number);
      const names = holidays.get([year, index + 1, day].join('-'));
      if (names) {
        label.className += ' calendar-holiday';
        const badge = document.createElement('small');
        badge.className = 'holiday-name';
        badge.textContent = names.join(' · ');
        label.append(badge);
        note.setAttribute('aria-label', month + ' ' + day + ', ' + year + ', ' + names.join(', ') + ': trip notes');
      }
      const religiousNames = religious.get([year, index + 1, day].join('-'));
      if (religiousNames) religiousNames.forEach(name => {
        const badge = document.createElement('small');
        badge.className = 'religious-event';
        badge.textContent = name;
        label.append(badge);
      });
      const imported = importedCalendar[[year, index + 1, day].join('-')];
      if (Array.isArray(imported)) imported.forEach(title => {
        if (typeof title !== 'string') return;
        const event = document.createElement('small');
        event.className = 'imported-event';
        event.textContent = title;
        label.append(event);
      });
      label.append(note); grid.append(label);
    }
    section.append(grid); yearColumn.append(section);
    });
  }
}
yearInput.addEventListener('change', renderYear);
renderYear();

const importStatus = document.querySelector('#calendar-import-status');
function importCalendarText(text) {
  if (text.length > 2000000) throw new Error('Please use a calendar file smaller than 2 MB.');
  if (!text.includes('BEGIN:VCALENDAR') || !text.includes('END:VCALENDAR')) throw new Error('This link did not return an iCalendar (.ics) file. Use the provider’s public .ics export link.');
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const events = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  const result = {};
  let imported = 0, skipped = 0;
  const dateValue = value => {
    const match = /^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z?)?$/.exec(value || '');
    if (!match) return null;
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return year >= 1900 && year <= 2100 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  };
  for (const event of events) {
    const props = {};
    for (const line of event.split(/\r?\n/)) {
      const colon = line.indexOf(':');
      if (colon < 0) continue;
      props[line.slice(0, colon).split(';')[0].toUpperCase()] = line.slice(colon + 1);
    }
    if (props.STATUS === 'CANCELLED') continue;
    if (props.RRULE || props.RDATE || props.RECURRENCE_ID) { skipped++; continue; }
    const start = dateValue(props.DTSTART);
    if (!start) { skipped++; continue; }
    const allDay = /^\d{8}$/.test(props.DTSTART);
    let end = props.DTEND ? dateValue(props.DTEND) : null;
    if (props.DTEND && !end) { skipped++; continue; }
    if (end && !allDay && /T000000Z?$/.test(props.DTEND)) end = new Date(end.getTime() - 86400000);
    if (!end) {
      const duration = /^P(?:(\d+)W)?(?:(\d+)D)?$/.exec(props.DURATION || '');
      const days = duration ? Number(duration[1] || 0) * 7 + Number(duration[2] || 0) : 1;
      if (props.DURATION && !duration) { skipped++; continue; }
      end = new Date(start.getTime() + Math.max(1, days) * 86400000);
    } else if (!allDay) end = new Date(end.getTime() + 86400000);
    const days = (end - start) / 86400000;
    if (days < 1 || days > 370) { skipped++; continue; }
    const title = (props.SUMMARY || 'Calendar event').replace(/\\[nN]/g, ' ').replace(/\\([,;\\])/g, '$1');
    for (let day = new Date(start); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
      const key = [day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()].join('-');
      result[key] = [...new Set([...(result[key] || []), title])];
    }
    imported++;
  }
  if (!imported) throw new Error('No supported events found. Export individual event occurrences as .ics; repeating events are not supported.');
  // Merge additional calendars; importing updated dates requires clearing the previous import first.
  for (const [key, titles] of Object.entries(result)) result[key] = [...new Set([...(importedCalendar[key] || []), ...titles])];
  const combined = {...importedCalendar, ...result};
  let saved = true;
  try { localStorage.setItem('trottola-imported-calendar', JSON.stringify(combined)); } catch { saved = false; }
  importedCalendar = combined;
  renderYear();
  importStatus.textContent = imported + ' events imported. ' + (skipped ? skipped + ' repeating or unsupported events skipped. ' : '') + (saved ? 'Saved in this browser. Clear imports before importing a revised calendar.' : 'Saving is unavailable; imported events last for this visit.');
}
document.querySelector('#calendar-import-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = document.querySelector('#calendar-import-button');
  button.disabled = true;
  importStatus.textContent = 'Importing calendar…';
  try {
    const raw = document.querySelector('#calendar-import-url').value.trim().replace(/^webcal:/i, 'https:');
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use a public https calendar link.');
    const response = await fetch(url.href, {credentials: 'omit', signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error('The calendar could not be downloaded. Check that the link is public, or upload its .ics file.');
    importCalendarText(await response.text());
  } catch (error) {
    importStatus.textContent = error instanceof TypeError || error.name === 'TimeoutError' ? 'The provider blocked the download or is unavailable. Download its .ics file and use the file option below.' : error.message;
  } finally { button.disabled = false; }
});
document.querySelector('#calendar-import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try { if (file.size > 2000000) throw new Error('Please use a calendar file smaller than 2 MB.'); importCalendarText(await file.text()); }
  catch (error) { importStatus.textContent = error.message; }
  event.target.value = '';
});
document.querySelector('#calendar-import-clear').addEventListener('click', () => {
  importedCalendar = {};
  try { localStorage.removeItem('trottola-imported-calendar'); importStatus.textContent = 'Imported events removed. Your daily notes are preserved.'; }
  catch { importStatus.textContent = 'Imported events removed for this visit; stored imports could not be cleared.'; }
  renderYear();
});

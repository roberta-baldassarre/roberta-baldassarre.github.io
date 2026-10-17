const campSearch = document.querySelector('#camp-search');
const campEntries = [...document.querySelectorAll('.camp-entry')];
const campCount = document.querySelector('#camp-count');
const campEmpty = document.querySelector('#camp-empty');
const searchableCamps = campEntries.map(entry => ({entry, text: entry.textContent.toLocaleLowerCase()}));
if (campSearch) {
  document.querySelector('.camp-search').hidden = false;
  campSearch.addEventListener('input', () => {
    const terms = campSearch.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    searchableCamps.forEach(({entry, text}) => {
      const matches = terms.every(term => text.includes(term));
      entry.hidden = !matches;
      if (matches) count++;
    });
    campCount.textContent = count + ' of ' + campEntries.length + ' camp resources';
    campEmpty.hidden = count !== 0;
  });
}

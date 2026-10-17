(() => {
  const boxes = [...document.querySelectorAll('[data-camp-plan]')];
  if (!boxes.length) return;
  const key = 'trottola-camp-planning-checklist';
  const status = document.querySelector('#camp-checklist-status');
  let available = true;
  function updateStatus() {
    const complete = boxes.filter(box => box.checked).length;
    status.textContent = complete + ' of ' + boxes.length + ' complete. ' + (available ? 'Saved in this browser on this device.' : 'Saving is unavailable; your checklist works for this visit.');
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved && typeof saved === 'object') boxes.forEach(box => { box.checked = saved[box.dataset.campPlan] === true; });
  } catch { available = false; }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(Object.fromEntries(boxes.map(box => [box.dataset.campPlan, box.checked]))));
      available = true;
    } catch { available = false; }
    updateStatus();
  }
  boxes.forEach(box => box.addEventListener('change', save));
  document.querySelector('#camp-checklist-reset').addEventListener('click', () => {
    boxes.forEach(box => { box.checked = false; });
    save();
  });
  updateStatus();
})();

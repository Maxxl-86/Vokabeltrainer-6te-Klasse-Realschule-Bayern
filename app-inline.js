// Reset-Funktionen
function highlightReset() {
  const section = document.querySelector('.blocks');
  if(section){
    section.style.transition = 'background-color 0.5s';
    section.style.backgroundColor = '#22c55e'; // Grün als Feedback
    setTimeout(()=> section.style.backgroundColor = '', 500);
  }
}

function resetSelected(){
  // Hier würden die ausgewählten Blöcke zurückgesetzt
  console.log('Reset für Auswahl durchgeführt');
  highlightReset();
}

function resetAll(){
  // Hier würden alle Blöcke zurückgesetzt
  console.log('Reset für alle durchgeführt');
  highlightReset();
}

document.getElementById('resetSelectedBtn').addEventListener('click', resetSelected);
document.getElementById('resetAllBtn').addEventListener('click', resetAll);

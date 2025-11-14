const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Disease database
const replies = {
  fever: "Fever: Give clean water, keep the body cool, allow rest. Visit a clinic if the fever is high or lasts more than 2 days.",
  cold: "Common Cold: Drink warm fluids, rest, inhale steam. Visit a clinic only if breathing becomes hard.",
  cough: "Cough: Cover mouth, drink warm liquids, avoid dust and smoke. If cough lasts more than a week, visit a health worker.",
  dengue: "Dengue: Symptoms include high fever, body pain, headache. Prevention: avoid mosquito bites, use nets, keep surroundings clean.",
  malaria: "Malaria: Caused by mosquito bites. Prevention: mosquito nets, remove standing water, wear long clothes.",
  typhoid: "Typhoid: Spread through contaminated food or water. Prevention: boil drinking water, wash hands, avoid unsafe street food.",
  diarrhea: "Diarrhea: Give ORS solution, drink clean water. Danger signs: dehydration (dry mouth, dizziness). Visit clinic if severe.",
  asthma: "Asthma: Avoid smoke, dust, cold air. Use inhaler if prescribed. Seek help if breathing becomes difficult.",
  allergy: "Skin Allergy: Wash the area with clean water, avoid scratching. If swelling spreads, consult a health worker.",
  covid: "COVID-19: Wear mask, wash hands, avoid crowds, get vaccinated. Symptoms: fever, cough, breathing difficulty.",
  cancer: "Cancer: Symptoms vary. Early checkups are important. Avoid tobacco, alcohol. Visit a hospital for proper screening.",
  cholera: "Cholera: Severe diarrhea and vomiting. Immediate ORS, clean water. Go to clinic urgently.",
  jaundice: "Jaundice: Yellow eyes and skin. Avoid oily foods, drink clean water. Visit hospital for tests."
};

// Fallback answer
const fallback = "I’m not sure about that. Try asking about: fever, dengue, malaria, diarrhea, cough, cold, typhoid, asthma, allergy, jaundice.";

// Button & Enter key send
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  userInput.value = "";

  setTimeout(() => botReply(text), 500);
}

function appendMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = "msg " + sender;
  msg.innerText = text;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function botReply(text) {
  const cleaned = text.toLowerCase();
  let answer = null;

  for (let key in replies) {
    if (cleaned.includes(key)) {
      answer = replies[key];
      break;
    }
  }

  if (!answer) answer = fallback;

  appendMessage(answer, "bot");
}

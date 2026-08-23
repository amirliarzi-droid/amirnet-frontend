import { useState, useEffect } from 'react'
import './App.css'

const FULL_EXAM_SECTIONS = [
  { id: 1, type: "sentence-completion", qCount: 4, minutes: 4, title: "השלמת משפטים" },
  { id: 2, type: "sentence-completion", qCount: 4, minutes: 4, title: "השלמת משפטים" },
  { id: 3, type: "reading", qCount: 5, minutes: 15, title: "הבנת הנקרא" },
  { id: 4, type: "restatement", qCount: 3, minutes: 6, title: "ניסוח מחדש" },
  { id: 5, type: "restatement", qCount: 3, minutes: 6, title: "ניסוח מחדש" },
  { id: 6, type: "sentence-completion", qCount: 4, minutes: 4, title: "השלמת משפטים" }
];

function App() {
  const [currentScreen, setCurrentScreen] = useState("home");
  const [examHistory, setExamHistory] = useState([]);
  const [currentExamConfig, setCurrentExamConfig] = useState(FULL_EXAM_SECTIONS);

  // התחלת מבחן מלא
  const startFullSimulation = () => {
    setCurrentExamConfig(FULL_EXAM_SECTIONS);
    setCurrentScreen("simulation");
  };

  // התחלת תרגול ממוקד (פרק אחד בלבד)
  const startPractice = (type, title, qCount, minutes) => {
    setCurrentExamConfig([{ id: 1, type, qCount, minutes, title: `תרגול ממוקד: ${title}` }]);
    setCurrentScreen("simulation");
  };

  const finishExam = (history) => {
    setExamHistory(history);
    setCurrentScreen("debrief");
  };

  return (
    <div className="app-container">
      {currentScreen === "home" && (
        <div className="welcome-screen">
          <div className="header-logo">AMIRnet</div>
          <h1>סימולטור אמירנט אדפטיבי 🧠</h1>
          <p>בחר את אופן הלמידה הרצוי:</p>
          <div className="action-buttons-container">
            <button className="start-btn primary-btn" onClick={startFullSimulation}>
              התחל סימולציה מלאה (מבחן שלם)
            </button>
            <button className="start-btn secondary-btn" onClick={() => setCurrentScreen("practice_menu")}>
              תרגול ממוקד לפי פרק
            </button>
          </div>
        </div>
      )}

      {currentScreen === "practice_menu" && (
        <div className="welcome-screen">
          <div className="header-logo">AMIRnet - Practice</div>
          <h2>בחר את נושא התרגול</h2>
          <div className="action-buttons-container column-layout">
            <button className="start-btn practice-btn" onClick={() => startPractice("sentence-completion", "השלמת משפטים", 4, 4)}>
              השלמת משפטים (4 דקות)
            </button>
            <button className="start-btn practice-btn" onClick={() => startPractice("restatement", "ניסוח מחדש", 3, 6)}>
              ניסוח מחדש (6 דקות)
            </button>
            <button className="start-btn practice-btn" onClick={() => startPractice("reading", "הבנת הנקרא", 5, 15)}>
              הבנת הנקרא (15 דקות)
            </button>
          </div>
          <button className="back-btn" onClick={() => setCurrentScreen("home")}>חזור למסך הראשי</button>
        </div>
      )}

      {currentScreen === "simulation" && (
        <SimulationEngine 
          examConfig={currentExamConfig} 
          onFinish={finishExam} 
          onCancel={() => setCurrentScreen("home")} 
        />
      )}

      {currentScreen === "debrief" && (
        <DebriefScreen history={examHistory} onHome={() => setCurrentScreen("home")} />
      )}
    </div>
  );
}

// ==========================================
// מנוע הסימולציה (עודכן כדי לקבל קונפיגורציה דינמית)
// ==========================================
function SimulationEngine({ examConfig, onFinish, onCancel }) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(5);
  
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [history, setHistory] = useState([]);

  const currentSectionConfig = examConfig[sectionIdx];

  useEffect(() => {
    const loadSection = async () => {
      setIsLoading(true);
      setAnswers({});
      setFlagged({});
      setCurrentQIdx(0);
      setTimeLeft(currentSectionConfig.minutes * 60);

      try {
        let loadedQuestions = [];
        if (currentSectionConfig.type === "reading") {
          const res = await fetch(`https://amirnet-api.onrender.com/generate/reading/${currentLevel}`);
          const data = await res.json();
          loadedQuestions = data.data.questions.map(q => ({ ...q, readingText: data.data.text }));
        } else {
          const promises = [];
          for (let i = 0; i < currentSectionConfig.qCount; i++) {
            promises.push(fetch(`https://amirnet-api.onrender.com/generate/${currentSectionConfig.type}/${currentLevel}`).then(r => r.json()));
          }
          const results = await Promise.all(promises);
          loadedQuestions = results.map(r => r.data);
        }
        setQuestions(loadedQuestions);
      } catch (err) {
        console.error("Failed to load section:", err);
      }
      setIsLoading(false);
    };

    loadSection();
  }, [sectionIdx, currentLevel, currentSectionConfig]);

  useEffect(() => {
    if (isLoading || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleSectionFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [isLoading, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSectionFinish = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const selectedOptionIdx = answers[idx];
      if (selectedOptionIdx !== undefined && q.options[selectedOptionIdx]?.isCorrect) {
        correctCount++;
      }
    });

    const sectionResult = {
      sectionConfig: currentSectionConfig,
      level: currentLevel,
      questions: questions,
      userAnswers: answers,
      correctCount: correctCount
    };
    const newHistory = [...history, sectionResult];
    setHistory(newHistory);

    const successRate = correctCount / currentSectionConfig.qCount;
    let nextLevel = currentLevel;
    if (successRate >= 0.75 && currentLevel < 10) nextLevel++;
    if (successRate <= 0.40 && currentLevel > 1) nextLevel--;
    
    if (sectionIdx + 1 < examConfig.length) {
      setCurrentLevel(nextLevel);
      setSectionIdx(sectionIdx + 1);
    } else {
      onFinish(newHistory);
    }
  };

  if (isLoading) {
    return (
      <div className="welcome-screen">
        <h2>מכין שאלות לפרק: {currentSectionConfig.title}... 🤖</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  const currentQ = questions[currentQIdx];

  return (
    <div className="exam-engine">
      <div className="exam-top-bar">
        <div className="timer-box">
          <span className={timeLeft < 60 ? "time-warning" : ""}>{formatTime(timeLeft)}</span>
          <span style={{fontSize: "12px", display:"block"}}>הזמן שנותר</span>
        </div>
        <div className="question-navigator">
          {questions.map((_, idx) => (
            <div 
              key={idx} 
              className={`nav-circle ${answers[idx] !== undefined ? 'answered' : ''} ${currentQIdx === idx ? 'current' : ''}`}
              onClick={() => setCurrentQIdx(idx)}
            >
              {idx + 1}
              {flagged[idx] && <span className="pin-icon">📌</span>}
            </div>
          ))}
        </div>
        <button className="flag-btn" onClick={() => setFlagged({ ...flagged, [currentQIdx]: !flagged[currentQIdx] })}>
          {flagged[currentQIdx] ? "הסר נעץ 📌" : "סמן שאלה 📌"}
        </button>
      </div>

      <div className="exam-header">
        <h2>{currentSectionConfig.title} - פרק {sectionIdx + 1} מתוך {examConfig.length}</h2>
      </div>

      <div className={`question-area ${currentSectionConfig.type === 'reading' ? 'split-screen' : ''}`}>
        {currentSectionConfig.type === 'reading' && (
          <div className="reading-text-panel">
            <p>{currentQ.readingText}</p>
          </div>
        )}
        <div className="question-content-panel">
          {currentSectionConfig.type === "restatement" && <p className="original-sentence">{currentQ.original_sentence}</p>}
          {currentSectionConfig.type === "sentence-completion" && <p className="original-sentence">{currentQ.sentence}</p>}
          {currentSectionConfig.type === "reading" && <p className="original-sentence">{currentQ.question}</p>}

          <div className="options-list">
            {currentQ.options && currentQ.options.map((option, idx) => (
              <label key={idx} className={`option-row ${answers[currentQIdx] === idx ? 'selected' : ''}`}>
                <input 
                  type="radio" name={`q-${currentQIdx}`} checked={answers[currentQIdx] === idx}
                  onChange={() => setAnswers({ ...answers, [currentQIdx]: idx })}
                />
                <span className="option-text">{option?.text || "תשובה חסרה"}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="exam-bottom-bar">
        <button className="nav-btn" disabled={currentQIdx === 0} onClick={() => setCurrentQIdx(prev => prev - 1)}>
          &lt; הקודם
        </button>
        {currentQIdx === questions.length - 1 ? (
          <button className="finish-section-btn" onClick={handleSectionFinish}>סיים פרק</button>
        ) : (
          <button className="nav-btn" onClick={() => setCurrentQIdx(prev => prev + 1)}>הבא &gt;</button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// מסך התחקור (Debriefing) החדש!
// ==========================================
function DebriefScreen({ history, onHome }) {
  let totalQuestions = 0;
  let totalCorrect = 0;

  history.forEach(section => {
    totalQuestions += section.questions.length;
    totalCorrect += section.correctCount;
  });

  // חישוב ציון אמירנט (סולם 50-150)
  const finalScore = totalQuestions > 0 ? 50 + Math.round((totalCorrect / totalQuestions) * 100) : 50;

  return (
    <div className="debrief-container">
      <div className="debrief-header">
        <h1>סיכום ותחקור מבחן 📊</h1>
        <div className="score-card">
          <h2>ציון אמירנט: {finalScore}</h2>
          <p>תשובות נכונות: {totalCorrect} מתוך {totalQuestions}</p>
        </div>
        <button className="start-btn primary-btn" onClick={onHome}>חזור למסך הראשי</button>
      </div>

      <div className="debrief-content">
        {history.map((section, sIdx) => (
          <div key={sIdx} className="debrief-section">
            <h3>פרק {sIdx + 1}: {section.sectionConfig.title} (רמה {section.level})</h3>
            <p>הצלחה בפרק: {section.correctCount} / {section.questions.length}</p>
            
            <div className="debrief-questions-list">
              {section.questions.map((q, qIdx) => {
                const userAnsIdx = section.userAnswers[qIdx];
                return (
                  <div key={qIdx} className="debrief-question-card">
                    <p className="d-q-number">שאלה {qIdx + 1}</p>
                    
                    {/* הצגת השאלה בהתאם לסוג */}
                    {section.sectionConfig.type === 'reading' && <p className="d-q-text"><strong>טקסט:</strong> {q.readingText}</p>}
                    <p className="d-q-text">
                      {q.original_sentence || q.sentence || q.question}
                    </p>

                    <div className="d-options">
                      {q.options.map((opt, oIdx) => {
                        let statusClass = "d-opt-neutral";
                        if (opt.isCorrect) statusClass = "d-opt-correct"; // התשובה הנכונה תמיד ירוקה
                        else if (userAnsIdx === oIdx && !opt.isCorrect) statusClass = "d-opt-wrong"; // מה שסימנת וטעינו אדום

                        return (
                          <div key={oIdx} className={`d-opt ${statusClass}`}>
                            {oIdx + 1}. {opt.text}
                            {userAnsIdx === oIdx && " 👈 (הבחירה שלך)"}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
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
  const [initialLevel, setInitialLevel] = useState(5); // רמה התחלתית
  const [practiceLevelInput, setPracticeLevelInput] = useState(5); // קלט מהמשתמש

  const startFullSimulation = () => {
    setInitialLevel(5); // מבחן מלא תמיד מתחיל ברמה 5
    setCurrentExamConfig(FULL_EXAM_SECTIONS);
    setCurrentScreen("simulation");
  };

  const startPracticeConfig = (config) => {
    setInitialLevel(practiceLevelInput); // תרגול מתחיל ברמה שהמשתמש בחר
    setCurrentExamConfig(config);
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
              אימון ממוקד לפי פרק
            </button>
          </div>
        </div>
      )}

      {currentScreen === "practice_menu" && (
        <div className="welcome-screen">
          <div className="header-logo">AMIRnet - Practice</div>
          <h2>הגדרות תרגול</h2>
          
          <div className="level-selector-box">
            <label>בחר רמה התחלתית (1-10):</label>
            <input 
              type="number" 
              min="1" max="10" 
              value={practiceLevelInput} 
              onChange={(e) => setPracticeLevelInput(Number(e.target.value))}
            />
          </div>

          <div className="action-buttons-container column-layout">
            <button className="start-btn practice-btn" onClick={() => startPracticeConfig([
              { id: 1, type: "sentence-completion", qCount: 15, minutes: 15, title: "השלמת משפטים - תרגול" }
            ])}>
              השלמת משפטים (15 שאלות)
            </button>
            
            <button className="start-btn practice-btn" onClick={() => startPracticeConfig([
              { id: 1, type: "restatement", qCount: 15, minutes: 15, title: "ניסוח מחדש - תרגול" }
            ])}>
              ניסוח מחדש (15 שאלות)
            </button>
            
            {/* שני פרקי קריאה - האדפטיביות תישמר ביניהם! */}
            <button className="start-btn practice-btn" onClick={() => startPracticeConfig([
              { id: 1, type: "reading", qCount: 5, minutes: 15, title: "הבנת הנקרא - טקסט 1" },
              { id: 2, type: "reading", qCount: 5, minutes: 15, title: "הבנת הנקרא - טקסט 2" }
            ])}>
              הבנת הנקרא (2 טקסטים אדפטיביים)
            </button>

            <button className="start-btn practice-btn vocab-btn" onClick={() => setCurrentScreen("vocab_practice")}>
              📖 אימון אוצר מילים (פתוח)
            </button>
          </div>
          <button className="back-btn" onClick={() => setCurrentScreen("home")}>חזור למסך הראשי</button>
        </div>
      )}

      {currentScreen === "vocab_practice" && (
        <VocabPractice level={practiceLevelInput} onBack={() => setCurrentScreen("practice_menu")} />
      )}

      {currentScreen === "simulation" && (
        <SimulationEngine 
          examConfig={currentExamConfig} 
          initialLevel={initialLevel}
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
// מסך אימון אוצר מילים (Vocab Practice)
// ==========================================
function VocabPractice({ level, onBack }) {
  const [wordData, setWordData] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNewWord = async () => {
    setLoading(true);
    setShowResult(false);
    setUserInput("");
    try {
      const res = await fetch(`https://amirnet-api.onrender.com/generate/vocab/${level}`);
      const data = await res.json();
      setWordData(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNewWord();
  }, [level]);

  const checkAnswer = () => {
    const normInput = userInput.trim();
    const normAnswer = wordData.translation.trim();
    // בודק אם מה שהמשתמש כתב מוכל בתשובה או להפך כדי לסלוח על הטיות
    if (normAnswer.includes(normInput) || normInput.includes(normAnswer)) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
    setShowResult(true);
  };

  return (
    <div className="welcome-screen">
      <div className="vocab-container">
        <div className="exam-header" style={{borderRadius: "8px", marginBottom: "20px"}}>
          <h2>אימון אוצר מילים - רמה {level}</h2>
        </div>
        
        {loading ? (
          <div className="spinner"></div>
        ) : wordData ? (
          <>
            <div className="vocab-word">{wordData.word}</div>
            <input 
              className="vocab-input"
              type="text" 
              placeholder="הקלד את הפירוש בעברית..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={showResult}
              onKeyDown={(e) => e.key === 'Enter' && !showResult && checkAnswer()}
            />
            
            {!showResult ? (
              <button className="start-btn primary-btn" onClick={checkAnswer} disabled={!userInput}>
                בדוק אותי
              </button>
            ) : (
              <div className={`vocab-result ${isCorrect ? 'vocab-correct' : 'vocab-incorrect'}`}>
                {isCorrect ? '✅ מצוין!' : '❌ לא בדיוק...'}
                <br />
                <strong>הפירוש הנכון: </strong> {wordData.translation}
              </div>
            )}

            {showResult && (
              <button className="next-word-btn" onClick={loadNewWord}>
                מילה הבאה ➔
              </button>
            )}
          </>
        ) : null}
      </div>
      <button className="back-btn" onClick={onBack} style={{marginTop: "30px"}}>חזור לתרגולים</button>
    </div>
  );
}

// ==========================================
// מנוע הסימולציה
// ==========================================
function SimulationEngine({ examConfig, initialLevel, onFinish, onCancel }) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
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
// מסך התחקור
// ==========================================
function DebriefScreen({ history, onHome }) {
  let totalQuestions = 0;
  let totalCorrect = 0;

  history.forEach(section => {
    totalQuestions += section.questions.length;
    totalCorrect += section.correctCount;
  });

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
                    {section.sectionConfig.type === 'reading' && <p className="d-q-text"><strong>טקסט:</strong> {q.readingText}</p>}
                    <p className="d-q-text">{q.original_sentence || q.sentence || q.question}</p>

                    <div className="d-options">
                      {q.options.map((opt, oIdx) => {
                        let statusClass = "d-opt-neutral";
                        if (opt.isCorrect) statusClass = "d-opt-correct";
                        else if (userAnsIdx === oIdx && !opt.isCorrect) statusClass = "d-opt-wrong";

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
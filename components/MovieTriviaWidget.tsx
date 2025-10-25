import React, { useState, useEffect } from 'react';
import '../styles/MovieTriviaWidget.css';

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

const triviaQuestions: TriviaQuestion[] = [
  {
    question: "Which movie won the Academy Award for Best Picture in 2020?",
    options: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"],
    correctAnswer: 2,
    difficulty: 'medium',
    category: 'Awards'
  },
  {
    question: "Who directed 'The Godfather'?",
    options: ["Martin Scorsese", "Francis Ford Coppola", "Steven Spielberg", "Quentin Tarantino"],
    correctAnswer: 1,
    difficulty: 'easy',
    category: 'Directors'
  },
  {
    question: "What year was the first 'Star Wars' movie released?",
    options: ["1975", "1977", "1979", "1980"],
    correctAnswer: 1,
    difficulty: 'medium',
    category: 'Release Dates'
  },
  {
    question: "Which actor played Tony Stark in the MCU?",
    options: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"],
    correctAnswer: 1,
    difficulty: 'easy',
    category: 'Actors'
  },
  {
    question: "What is the highest-grossing film of all time (unadjusted for inflation)?",
    options: ["Avengers: Endgame", "Avatar", "Titanic", "Star Wars: The Force Awakens"],
    correctAnswer: 1,
    difficulty: 'hard',
    category: 'Box Office'
  },
  {
    question: "Which film won the first Academy Award for Best Animated Feature?",
    options: ["Toy Story", "Shrek", "Monsters, Inc.", "Finding Nemo"],
    correctAnswer: 1,
    difficulty: 'hard',
    category: 'Awards'
  },
  {
    question: "Who composed the score for 'Inception'?",
    options: ["John Williams", "Hans Zimmer", "Ennio Morricone", "Howard Shore"],
    correctAnswer: 1,
    difficulty: 'medium',
    category: 'Music'
  },
  {
    question: "In which city does 'The Dark Knight' primarily take place?",
    options: ["New York", "Chicago", "Gotham City", "Los Angeles"],
    correctAnswer: 2,
    difficulty: 'easy',
    category: 'Settings'
  }
];

export const MovieTriviaWidget: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<number[]>([]);

  const getRandomQuestion = () => {
    const availableQuestions = triviaQuestions
      .map((q, index) => index)
      .filter(index => !usedQuestions.includes(index));
    
    if (availableQuestions.length === 0) {
      setUsedQuestions([]);
      return triviaQuestions[0];
    }
    
    const randomIndex = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    setUsedQuestions([...usedQuestions, randomIndex]);
    return triviaQuestions[randomIndex];
  };

  useEffect(() => {
    setCurrentQuestion(getRandomQuestion());
  }, []);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showAnswer) {
      setSelectedAnswer(answerIndex);
      setShowAnswer(true);
      
      if (answerIndex === currentQuestion?.correctAnswer) {
        setScore(score + 1);
      }
      setQuestionsAnswered(questionsAnswered + 1);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestion(getRandomQuestion());
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  const handleReset = () => {
    setScore(0);
    setQuestionsAnswered(0);
    setUsedQuestions([]);
    setCurrentQuestion(getRandomQuestion());
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  if (!currentQuestion) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="movie-trivia-widget">
      <div className="trivia-header">
        <h3>🎬 Movie Trivia</h3>
        <div className="trivia-stats">
          <span className="score">Score: {score}/{questionsAnswered}</span>
          <button className="reset-btn" onClick={handleReset} title="Reset Score">↻</button>
        </div>
      </div>

      <div className="trivia-question-card">
        <div className="question-meta">
          <span 
            className="difficulty-badge" 
            style={{ backgroundColor: getDifficultyColor(currentQuestion.difficulty) }}
          >
            {currentQuestion.difficulty.toUpperCase()}
          </span>
          <span className="category-badge">{currentQuestion.category}</span>
        </div>

        <h4 className="question-text">{currentQuestion.question}</h4>

        <div className="options-container">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctAnswer;
            const isSelected = index === selectedAnswer;
            
            let buttonClass = 'option-button';
            if (showAnswer) {
              if (isCorrect) buttonClass += ' correct';
              else if (isSelected) buttonClass += ' incorrect';
            } else if (isSelected) {
              buttonClass += ' selected';
            }

            return (
              <button
                key={index}
                className={buttonClass}
                onClick={() => handleAnswerSelect(index)}
                disabled={showAnswer}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
                {showAnswer && isCorrect && <span className="check-icon">✓</span>}
                {showAnswer && isSelected && !isCorrect && <span className="x-icon">✗</span>}
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div className="answer-feedback">
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <p className="correct-feedback">🎉 Correct! Great job!</p>
            ) : (
              <p className="incorrect-feedback">
                ❌ Incorrect. The correct answer was {currentQuestion.options[currentQuestion.correctAnswer]}.
              </p>
            )}
            <button className="next-question-btn" onClick={handleNextQuestion}>
              Next Question →
            </button>
          </div>
        )}
      </div>

      <div className="trivia-footer">
        <p className="trivia-tip">💡 Test your movie knowledge!</p>
      </div>
    </div>
  );
};

export default MovieTriviaWidget;
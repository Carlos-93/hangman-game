import { useState, useEffect, useCallback } from 'react';
import Title from '../Title/Title';
import Instructions from '../Instructions/Instructions';
import Hangman from '../Hangman/Hangman';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import processGameResult from '../../services/api';

// Physics words for the game
const words = ['newton', 'einstein', 'galileo', 'ampere', 'faraday', 'tesla', 'maxwell', 'hertz', 'ohm', 'volt', 'watt', 'force', 'energy', 'particle', 'speed', 'mass', 'volume'];

// Function to get a random word from the words array
const getRandomWord = () => words[Math.floor(Math.random() * words.length)];

export default function Game() {
    // State variables for the game 
    const [word, setWord] = useState('');
    const [guessedLetters, setGuessedLetters] = useState([]);
    const [letterStatus, setLetterStatus] = useState({});
    const [modalMessage, setModalMessage] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [errors, setErrors] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(0);
    const [gameWon, setGameWon] = useState(false);

    // Get the user_id from the URL
    const params = new URLSearchParams(window.location.search);
    const user_id = params.get('user_id');
    const game_id = 2;

    // Functions
    const startGame = () => {
        setWord(getRandomWord());
        setAttempts(0);
        setGuessedLetters([]);
        setLetterStatus({});
        setScore(0);
        setModalOpen(false);
        setModalMessage('');
        setIsGameOver(false);
        setGameWon(false);
        setTime(0);
        setErrors(0);
    }

    const endGame = (message) => {
        setModalMessage(message);
        setModalOpen(true);
        setIsGameOver(true);
    }

    const closeModalAndRedirect = () => {
        setModalOpen(false);
        window.location.href = 'http://127.0.0.1:8000/games';
    }

    const handleGuess = (letter) => {
        if (!isGameOver && !guessedLetters.includes(letter)) {
            setGuessedLetters([...guessedLetters, letter]);
            if (word.toUpperCase().includes(letter)) {
                setLetterStatus({ ...letterStatus, [letter]: 'correct' });
                setScore(prevScore => prevScore + 20);
            } else {
                setLetterStatus({ ...letterStatus, [letter]: 'incorrect' });
                setAttempts(attempts + 1);
                setErrors(errors + 1);
            }
        }
    }

    // Callbacks
    const handleGameResult = useCallback(async (finalScore) => {
        await processGameResult(finalScore, user_id, game_id, time);
        setModalOpen(true);
    }, [user_id, game_id, time]);

    // Effects
    useEffect(() => {
        startGame();
    }, []);

    useEffect(() => {
        if (attempts >= 10) {
            endGame('Game Over!');
            handleGameResult(score);
        }
    }, [attempts]);

    useEffect(() => {
        if (word && word.split('').every(letter => guessedLetters.includes(letter.toUpperCase()))) {
            if (!gameWon) {
                const newScore = score + 100;
                setScore(newScore);
                endGame('Congratulations! You won!');
                handleGameResult(newScore);
                setGameWon(true);
            }
        }
    }, [guessedLetters, word, score, gameWon]);

    useEffect(() => {
        if (!isGameOver) {
            const timerId = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [isGameOver]);

    // Render the component
    return (
        <main className="flex flex-col w-[80rem] backdrop-blur-2xl rounded-3xl border border-yellow-400 mx-6 p-5">
            {/* Instructions and Title components */}
            <header className='flex items-center justify-between'>
                <Instructions />
                <Title />
            </header>

            <section className="flex flex-col justify-center items-center">
                <div className="flex flex-col xl:flex-row w-full my-10 gap-16 justify-center md:justify-between items-center">
                    {/* Hangman component */}
                    <Hangman attempts={attempts} />
                    {/* Word's letters */}
                    <div className='flex-1 flex justify-center items-center'>
                        {word.split('').map((letter, index) => (
                            <span key={index} className="text-2xl mx-1 text-white">
                                {guessedLetters.includes(letter.toUpperCase()) ? letter.toUpperCase() : '__'}
                            </span>
                        ))}
                    </div>
                    {/* Buttons for the letters */}
                    <div className='flex-1 flex flex-wrap justify-center gap-[2px] lg:mx-40 xl:mx-0'>
                        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
                            let backgroundColor = 'bg-yellow-400';
                            let hoverColor = 'hover:bg-yellow-500';
                            let textColor = 'text-black';
                            let buttonClass = '';

                            if (letterStatus[letter] === 'correct') {
                                backgroundColor = 'bg-green-600'; hoverColor = 'hover:bg-green-600';
                            } else if (letterStatus[letter] === 'incorrect') {
                                backgroundColor = 'bg-red-600'; hoverColor = 'hover:bg-red-600';
                            }
                            if (isGameOver) {
                                buttonClass = 'opacity-70 cursor-not-allowed';
                            }
                            return (
                                <Button key={letter} onClick={() => handleGuess(letter)}
                                    backgroundColor={backgroundColor} textColor={textColor} hoverColor={hoverColor} className={buttonClass} disabled={isGameOver}>
                                    {letter}
                                </Button>
                            );
                        })}
                    </div>
                </div>
                {/* Erros */}
                <div className="flex absolute bottom-0 left-0 bg-white/20 w-fit px-5 py-2.5 m-6 rounded-xl text-white text-lg">
                    <p className='font-medium'>Errors:</p>
                    <p className='font-medium text-yellow-400 w-16 text-center'>{errors} / 10</p>
                </div>
                {/* Component to reset the game */}
                <Button onClick={startGame} backgroundColor="bg-red-600" textColor="text-white" hoverColor="hover:bg-red-500">
                    Reset Game
                </Button>
                {/* Score */}
                <div className="flex absolute bottom-0 right-0 bg-white/20 w-fit px-5 py-2.5 m-6 rounded-xl text-white text-lg">
                    <p className='font-medium'>Score:</p>
                    <p className='font-medium text-yellow-400 w-10 text-end'>{score}</p>
                </div>
            </section>
            {/* Modal component */}
            {modalOpen && <Modal message={modalMessage} score={score} onClose={closeModalAndRedirect} />}
        </main>
    );
}
import "./App.css";
import React from "react";
import io from "socket.io-client";
import { useEffect, useState } from "react";
import { Button, Form, Stack } from "react-bootstrap";

const URL = "https://task-seven-server.up.railway.app/";
const socket = io.connect(URL);
const emptySquares = { squares: Array(9).fill(null), myMove: true };

function calculateWinner(squares) {
    const winningPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let i = 0; i < winningPatterns.length; i++) {
        const [a, b, c] = winningPatterns[i];
        if (
            squares[a] &&
            squares[a] === squares[b] &&
            squares[a] === squares[c]
        ) {
            return squares[a];
        }
    }
    return null;
}

export default function App() {
    const [gameState, setGameState] = useState(emptySquares);
    const [room, setRoom] = useState(null);
    const [joined, setJoined] = useState(false);

    const joinRoom = () => {
        if (room) {
            socket.emit("join_room", room);
            setJoined(true);
        }
    };

    useEffect(() => {
        console.log("useeffect");
        socket.on("receive_restart", (data) => {
            setGameState(emptySquares);
        });
        socket.on("receive_move", (data) => {
            console.log(data);
            let squares = gameState.squares.slice(0);
            squares[data.message] = false;
            setGameState(() => ({
                squares: [...squares],
                myMove: data?.winner ? false : true,
                win: data?.winner,
            }));
        });
    });

    const sendMove = (message, squares) => {
        socket.emit("send_move", {
            message,
            room,
            winner: calculateWinner(squares),
        });
    };

    const handleClick = (i) => {
        if (gameState.myMove && room) {
            let squares = gameState.squares.slice(0);
            squares[i] = true;
            setGameState({ squares: [...squares], myMove: false });
            sendMove(i, squares);
        }
    };

    let winner;
    if (gameState.win) winner = "lose";
    else if (calculateWinner(gameState.squares)) winner = "win";

    const filtered = gameState.squares.filter((f) => f === null).length === 0;

    const handleRestart = () => {
        socket.emit("send_restart", { message: "restart", room });
        setGameState(emptySquares);
    };

    const renderSquare = (i) => {
        const check = gameState.squares[i];
        return (
            <button className="square" onClick={() => handleClick(i)}>
                {check ? "X" : check === false ? "O" : null}
            </button>
        );
    };

    return (
        <Stack gap={3}>
            {joined ? (
                <div className="board">
                    <div className="board-row">
                        {renderSquare(0)}
                        {renderSquare(1)}
                        {renderSquare(2)}
                    </div>
                    <div className="board-row">
                        {renderSquare(3)}
                        {renderSquare(4)}
                        {renderSquare(5)}
                    </div>
                    <div className="board-row">
                        {renderSquare(6)}
                        {renderSquare(7)}
                        {renderSquare(8)}
                    </div>
                </div>
            ) : (
                <>
                    <Form.Control
                        placeholder="Room Number..."
                        onChange={(event) => {
                            setRoom(event.target.value);
                        }}
                    />
                    <Button onClick={joinRoom}>Join</Button>
                </>
            )}
            {winner && <div className="status">{`You ${winner}`}</div>}
            {filtered && <div className="status">Draw!</div>}
            {(winner || filtered) && (
                <Button className="restart" onClick={handleRestart}>
                    Restart Game!
                </Button>
            )}
        </Stack>
    );
}

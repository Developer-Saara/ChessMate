const { Chess } = require('chess.js')

class Game{
    player1;
    player2;
    player1Id;
    player2Id;
    #moves;
    #board;
    #start_time;
    #moveCount = 0 

    constructor(player1,player1Id,player2,player2Id){
        this.player1 = player1
        this.player2 = player2
        this.player1Id = player1Id
        this.player2Id = player2Id
        this.#board =  new Chess()
        this.#moves = [] 
        this.#start_time = new Date()
        
        this.player1.send(JSON.stringify({
            type :'init_game',
            payload : {
                color : 'white'
            }
        }))
        this.player2.send(JSON.stringify({
            type :'init_game',
            payload : {
                color :'black'
            }
        }))
    }

    hasExceededTimeLimit() {
        const currentTime = new Date();
        const elapsedTime = currentTime - this.#start_time;
        const timeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds TODO: have change dynamically according to game type
        return elapsedTime > timeLimit;
    }

    makeMove(socket,move){

        //for validation of right player
        if (this.#moveCount % 2 === 0 && socket !== this.player1) {
            return ;
        }
        if (this.#moveCount % 2 === 1 && socket !== this.player2) {
            return ;
        }
        try {
            this.#board.move(move)
            this.#moves.push(move)
        } catch (error) {
            console.log(error);
            return
        }

        if (this.#board.isGameOver()) {
            this.player1.send(JSON.stringify({
                type:'game_over',
                payload:{
                    winner:this.#board.turn === "w" ? 'black' : 'white'
                }
            }))
            this.player2.send(JSON.stringify({
                type:'game_over',
                payload:{
                    winner:this.#board.turn === "w" ? 'black' : 'white'
                }
            }))
            return ;
        }

        if(this.#moveCount % 2 === 0){
            this.player2.send(JSON.stringify({
                type:'move',
                 move
            }))
        }else{
            this.player1.send(JSON.stringify({
                type:'move',
                move
            }))
        }
        console.log(this.#moves);
        this.#moveCount++
        //TODO : have a recovery mechanism for game to save data to data base 
    }
}

module.exports = Game
import Board from './Board.js';
import Sprite, {spriteLoader} from './Sprite.js';
import Vec2 from './Vec2.js';

class BubblePopper {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = 600;
        this.canvas.height = 600;
        
        if (!this.canvas) {
            throw new Error('Canvas not found!');
        }

        this.ctx = this.canvas.getContext('2d');
        this.entities = [];

        // score
        this.score = 0;
        this.scoreElem = document.getElementById('score');
        this.scoreMultiplier = 100;
    }

    init() {
        const spriteHandle = new Sprite('img/ccrush.png');
        this.board = new Board(9, new Vec2(0, 0), spriteHandle, this.canvas);
        this.entities.push(this.board);
    }

    start() {
        this.board.redraw();
        this.board.onScoreUpdate(this.updateScore.bind(this));
        this.tick();
    }

    tick() {
        this.entities.forEach(entity=>{
            entity.tick();
        });

        this.draw();
        requestAnimationFrame(this.tick.bind(this));
    }

    draw() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.entities.forEach(entity=>{
            entity.draw(this.ctx);
        });
    }

    updateScore(score) {
        this.score += score * this.scoreMultiplier;
        this.scoreElem.textContent = this.score;
    }
}

function start() {
    spriteLoader(()=>{
        const popper = new BubblePopper('canvas');
        popper.init();
        popper.start();
        deleteLoader();
    })
}

function deleteLoader() {
    const loader = document.getElementById('loading');
    loader.style = 'opacity:0;';
    setTimeout(()=>loader.remove(), 500);
}

start();
import Vec2 from "./Vec2.js";
import {randInt} from './Math.js';

const initialCellData = {
    "id": null,
    "name": null,
    "pos": new Vec2()
};

const DragOrientation = {
    "X": Symbol('X'),
    "Y": Symbol('Y'),
    "NotSet": Symbol('NotSet')
};

const spriteData = [
    {
        //"name": 'red',
        "pos": [1300, 185],
        "size": [140, 140]
    },
    {
        //"name": 'blue',
        "pos": [975, 420],
        "size": [140, 140]
    },
    {
        //"name": 'green',
        "pos": [1295, 800],
        "size": [140, 140]
    },
    {
        //"name": 'yellow',
        "pos": [1620, 16],
        "size": [140, 140]
    },
    {
        "name": 'selected',
        "pos": [280, 1570],
        "size": [170, 170]
    },
];

class Board {
    constructor(boardSize=8, pos, spriteHandle, canvas) {
        //setup necessary variables
        this.cellSize = new Vec2(65, 65);
        this.spriteHandle = spriteHandle;
        this.pos = pos;
        this.board = [];
        this.boardSize = boardSize;

        //setup canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');

        //set initial values
        for (let col=0;col<boardSize;col++) {
            let currCol = [];
            
            for(let row=0;row<boardSize;row++) {
                const pos = this.getCellCoordinate(row, col);

                const spriteId = randInt(4)-1;

                currCol.push({
                    ...initialCellData,
                    "pos": pos,
                    "id": spriteId
                });
            };

            this.board.push(currCol);
        }

        setTimeout(()=>{
            this.findPairs()
            this.redraw();
        }, 500);

        //setup named sprites
        spriteData.forEach((sprite, index)=>{
            spriteHandle.setNamedSprite({
                "name": sprite.name || index,
                "type": sprite.name,
                "size": this.cellSize,
                "spritePos": new Vec2(sprite.pos[0], sprite.pos[1]),
                "originalSize": new Vec2(sprite.size[0], sprite.size[1]),
            });
        });

        //setup selection crosshair
        this.drawSelected = false;
        this.selectedSprite = spriteHandle.get('selected');
        this.selectedCell = [0, 0];

        //setup mouse events
        //TODO: mouse events should be in its own class
        this.handleMouse(canvas);

        //testing purposes
        this.clickStartPos = new Vec2();
        this.currentDrag = DragOrientation.NotSet;

        // score updater
        this.scoreCallbacks = [];

    }

    /* 
    Sends score TO BE ADDED to the callbacks.
    NOTE: Does NOT sends the TOTAL score.
    */
    onScoreUpdate(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onScoreUpdate Callback must be a function!');
        }

        this.scoreCallbacks.push(callback);
        return true;
    }

    scoreUpdate(score) {
        this.scoreCallbacks.forEach(cb=>cb(score));
    }

    getCellCoordinate(row, col) {
        return new Vec2(
            row * this.cellSize.x, 
            col * this.cellSize.y)
    }

    handleMouse(canvas) {
        let dragging = false;
        let dragCell = new Vec2();
        let totalMovement = 0;

        function getCellPos(event, cellSize) {
            const y = Math.floor(
                (event.pageY - event.target.offsetTop) / cellSize.y);

            const x = Math.floor(
                (event.pageX - event.target.offsetLeft) / cellSize.x);

            return new Vec2(x, y);
        }

        function getMouseYX(event) {
            const y = event.pageY - event.target.offsetTop;
            const x = event.pageX - event.target.offsetLeft;

            return new Vec2(x, y);
        }

        canvas.oncontextmenu = e=>e.preventDefault();
        
        canvas.onmousedown = e => {
            e.preventDefault();
            
            dragCell = getCellPos(e, this.cellSize);
            if (this.board[dragCell.y][dragCell.x].id === null) {
                return
            }

            dragging = true;
            this.selectedCell = dragCell;
            this.drawSelected = true;

            const pos = getMouseYX(e);
            this.clickStartPos = pos;

            this.redraw();
        }

        canvas.onmouseup = e => {
            e.preventDefault();
            if (!dragging) {
                return;
            }

            const cell = getCellPos(e, this.cellSize);
            const dist = cell.distance(dragCell);

            if (cell.x !== dragCell.x || cell.y !== dragCell.y) {
                const orientationMatches = 
                    (this.currentDrag === DragOrientation.X && dist.x !== 0)
                    || (this.currentDrag === DragOrientation.Y && dist.y !== 0);
                
                const itemsAreTouching = dist.y <= 1 && dist.x <= 1;
                const notDiagonal = (dist.y + dist.x) === 1;

                if (orientationMatches && itemsAreTouching && notDiagonal) { 
                    /*copy of dragging*/
                    const copy = this.board[dragCell.y][dragCell.x];
                    
                    this.board[dragCell.y][dragCell.x] = 
                        this.board[cell.y][cell.x];

                    this.board[cell.y][cell.x] = copy;

                    this.board[cell.y][cell.x].pos = 
                        this.getCellCoordinate(cell.x, cell.y);
                }

                this.findPairs(found=>{
                    if (!found) {
                        this.scoreUpdate(-1);
                    }
                });
            }

            this.board[dragCell.y][dragCell.x].pos = 
                this.getCellCoordinate(dragCell.x, dragCell.y);

            this.redraw();

            dragging = false;
            totalMovement = 0;
            this.drawSelected = false;
            this.currentDrag = DragOrientation.NotSet;

        }

        canvas.onmousemove = e=>{
            if (!dragging) {
                return;
            }

            const pos = getMouseYX(e);
            let diff = pos.difference(this.clickStartPos);

            // check and lock the drag plane 
            if (this.currentDrag === DragOrientation.NotSet) {
                if (Math.abs(diff.y) > Math.abs(diff.x)) {
                    this.currentDrag = DragOrientation.Y;
                } else {
                    this.currentDrag = DragOrientation.X;
                }
            } else if (this.currentDrag === DragOrientation.X) {
                diff.y = 0;
            } else {
                diff.x = 0;
            }

            // dont go further than next cell
            const total = diff.x + diff.y;
            if (Math.abs(totalMovement + total) <= 65) {
                totalMovement += total;
            } else {
                diff.x = 0;
                diff.y = 0;
            }

            this.clickStartPos = pos;
            this.board[dragCell.y][dragCell.x].pos.y += diff.y;
            this.board[dragCell.y][dragCell.x].pos.x += diff.x;

            this.redraw();
        }
    }

    tick() {

    }

    redraw() {
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.board.forEach((cols, col)=>{
            cols.forEach(({id, name, pos}, row)=>{
                if (id !== null) {
                    const sprite = this.findSprite(id);

                    this.ctx.drawImage(sprite, 
                        pos.x, pos.y,
                        this.cellSize.x, this.cellSize.y);
                }
            });
        });

        if (this.drawSelected) {
            this.ctx.drawImage(this.selectedSprite,
                this.selectedCell[1] * this.cellSize.x,
                this.selectedCell[0] * this.cellSize.y)
        }
    }

    findSprite(id) {
        return this.spriteHandle.get(id);
    }

    draw(ctx) {
        ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
    }

    __rowCheck() {
        let rowMatches = [];
        this.board.forEach((cols, col)=>{
            let prev = {
                "id": -1,
                "count": 1,
                "lastPos": null
            };
            
            cols.forEach((cell, row)=>{
                if (cell.id !== null && prev.id === cell.id) {
                    prev.count += 1;

                    if (prev.count >= 3) {
                        prev = {
                            "id": cell.id,
                            "count": prev.count,
                            "lastPos": new Vec2(row, col)
                        }

                        // if we're on the right edge
                        if (row === this.boardSize-1) {
                            rowMatches.push(prev);
                        }
                    }
                } else {
                    if (prev.count >= 3) {
                        rowMatches.push(prev);
                    }

                    prev = {
                        "id": cell.id,
                        "count": 1
                    }
                }
            });
        });
        
        return rowMatches;
    }

    __colCheck() {
        let colMatches = [];

        for (let row=0; row<this.boardSize; row++) {

            let prev = {
                "id": -1,
                "count": 1,
                "lastPos": null
            };

            this.board.forEach((rows, col)=>{
                const cell = rows[row];

                if (cell.id !== null && prev.id === cell.id) {
                    prev.count += 1;

                    if (prev.count >= 3) {
                        prev = {
                            "id": cell.id,
                            "count": prev.count,
                            "lastPos": new Vec2(row, col)
                        }

                        // if we're on the bottom edge
                        if (col === this.boardSize-1) {
                            colMatches.push(prev);
                        }
                    }
                } else {
                    if (prev.count >= 3) {
                        colMatches.push(prev);
                    }

                    prev = {
                        "id": cell.id,
                        "count": 1
                    }
                }
            })
        };

        return colMatches;
    }

    findPairs(callback) {
        let foundAnyPair = false;
        const checkAndDropLoop = ()=> {
            let foundPairThisTime = false;

            const foundRow = this.__rowCheck();
            const foundCol = this.__colCheck();

            this._parsePairs({
                "row": foundRow,
                "col": foundCol
            });

            if (foundRow.length || foundCol.length) {
                foundAnyPair = true;
                foundPairThisTime = true;
            }

            const cellsDropped = this.dropCells();

            if (foundPairThisTime || cellsDropped) {
                this.redraw();
                setTimeout(checkAndDropLoop, 300);
                
            } else if (typeof callback === 'function') {                
                callback(foundAnyPair)
            }
        }
        
        checkAndDropLoop();
    }

    dropCells() {
        let didSomething = false;
        let continueLoop;

        do {
            continueLoop = false;
            for (let row=0; row<this.boardSize; row++) {
                let carry = null;

                this.board.forEach((rows, col)=>{
                    let cell = rows[row];

                    if (carry === null && cell.id === null) {
                        return //empty
                    } else if (carry !== null && cell.id === null) {

                        this.board[col][row] = {...carry.cell}; // copy
                        this.board[col][row].pos = 
                            this.getCellCoordinate(row, col)

                        this.board[carry.pos.y][carry.pos.x].id = null;
                        
                        carry = null;
                        continueLoop = true;
                        didSomething = true;
                    } else {
                        carry = {
                            "pos": new Vec2(row, col),
                            "cell": cell
                        }
                    }

                });
            }

        } while(continueLoop);

        return didSomething;
    }

    _parsePairs(matches) {
        matches.row.forEach(match=>{
            const pos = match.lastPos;

            for (let i=match.count-1;i>=0;i--) {
                this.board[pos.y][pos.x - i] = initialCellData;
                //                      ^^^
                // this is because we're working on rows.
            }
            
            this.scoreUpdate(match.count);
        });

        matches.col.forEach(match=>{
            const pos = match.lastPos;

            for (let i=match.count-1;i>=0;i--) {
                this.board[pos.y - i][pos.x] = initialCellData;
                //               ^^^
                // same story here too. working on cols.
            };

            this.scoreUpdate(match.count);
        })
    }
}

export default Board;

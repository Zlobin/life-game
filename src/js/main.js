(function(global, _, $) {
  'use strict';

  global.cancelRequestAnimFrame = (function() {
    return (
      global.cancelAnimationFrame ||
      global.webkitCancelRequestAnimationFrame ||
      global.mozCancelRequestAnimationFrame ||
      global.oCancelRequestAnimationFrame ||
      global.msCancelRequestAnimationFrame ||
      global.clearTimeout
    );
  }());

  global.requestAnimFrame = (function() {
    return (
      global.requestAnimationFrame ||
      global.webkitRequestAnimationFrame ||
      global.mozRequestAnimationFrame ||
      global.oRequestAnimationFrame ||
      global.msRequestAnimationFrame ||
      function(callback) {
        return global.setTimeout(callback, 1e3 / 60);
      }
    );
  }());

  var defaults = {
        width: 600,
        height: 600,
        fieldID: 'lifeField',
        beetlesID: 'lifeBeetles',
        field: {
          line: {
            color: '#666',
            width: .3
          },
          backgound: {
            color: '#262626'
          },
          size: {
            rows: 100,
            columns: 100
          }
        },
        beetle: {
          color: '#f00'
        }
      },
      document = global.document;

  // @link http://en.wikipedia.org/wiki/Conway's_Game_of_Life
  global.GameLife = function(options) {
    options = options || {};
    _.extend(options, defaults);

    var canvasField = document.getElementById(options.fieldID),
        canvasBeetles = document.getElementById(options.beetlesID),
        contextField,
        contextBeetles,
        world = [],
        prevWorld = [],
        status,
        timer,
        errorMessages = [],
        maxBeetles = options.field.size.rows * options.field.size.columns,
        liveBeetles = 0,
        cellWidth = options.width / options.field.size.rows,
        cellHeight = options.height / options.field.size.columns,
        setStatusReady = function() {
          status = 'ready';
        },
        setStatusStart = function() {
          status = 'started';
        },
        setStatusError = function(message) {
          message = message || 'N/A';
          status = 'error';
          errorMessages.push(message);
        },
        setFillColor = function(context, color) {
          context.fillStyle = color;
        },
        drawBeetle = function(coordX, coordY, color) {
          setFillColor(contextBeetles, color);
          contextField.strokeStyle = color;
          contextBeetles.fillRect(coordX + 1, coordY + 1, cellWidth - 2, cellHeight - 2);
        },
        getRandom = function(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        clearCoord = function() {
          var i = 0,
              j;

          for (; i < options.field.size.rows; i++) {
            world[i] = [];
            for (j = 0; j < options.field.size.columns; j++) {
              world[i][j] = 0;
            }
          }
        },
        fillBeetles = function(num) {
          var x,
              y,
              coordX,
              coordY;

          while (num--) {
            x = getRandom(0, options.field.size.rows - 1);
            y = getRandom(0, options.field.size.columns - 1);
            world[x][y] = 1;
            liveBeetles++;

            coordX = x * cellWidth;
            coordY = y * cellHeight;
            drawBeetle(coordX, coordY, options.beetle.color);
          }
        },
        drawField = function() {
          var i = 0;

          contextField.beginPath();
          contextField.lineWidth = options.field.line.width;
          contextField.strokeStyle = options.field.line.color;
          // Fill cells
          for (; i < options.width; i += cellWidth) {
            contextField.moveTo(i, 0);
            contextField.lineTo(i, options.height);
          }
          for (i = 0; i < options.height; i += cellHeight) {
            contextField.moveTo(0, i);
            contextField.lineTo(options.width, i);
          }
          contextField.closePath();
          contextField.stroke();
        },
        initClickEvent = function() {
          $(canvasBeetles).on('click', function(event) {
            var i = Math.floor(event.offsetX / cellWidth),
                j = Math.floor(event.offsetY / cellHeight);

            if (!_.isUndefined(world[i])) {
              if (!world[i][j]) {
                world[i][j] = 1;
                drawBeetle(i * cellWidth, j * cellHeight, options.beetle.color);
              } else {
                world[i][j] = 0;
                drawBeetle(i * cellWidth, j * cellHeight, options.field.backgound.color);                
              }
            }
          });
        },
        init = function() {
          setStatusReady();

          if (!canvasField || !canvasField.getContext) {
            setStatusError('Error canvas init');
          } else {
            canvasField.width = canvasBeetles.width = options.width;
            canvasField.height = canvasBeetles.height = options.height;

            contextField = canvasField.getContext('2d');
            contextBeetles = canvasBeetles.getContext('2d');
            if (!contextField) {
              setStatusError('Error 2d context init');
            } else {
              setFillColor(contextField, options.field.backgound.color);
              drawField(options.field.size.rows, options.field.size.columns);
            }
          }

          clearCoord();
          initClickEvent();
        },
        countLiveNeighbors = function(x, y) {
          var neighbours = 0,
              i = Math.max(x - 1, 0),
              j,
              iMax = Math.min(x + 1, options.field.size.rows - 1),
              jMax = Math.min(y + 1, options.field.size.columns - 1);

          for (; i <= iMax; i++) {
            for (j = Math.max(y - 1, 0); j <= jMax; j++) {
              if (i === x && j === y) {
                continue;
              }

              if (prevWorld[i][j]) {
                neighbours++;
              }
            }
          }

          return neighbours;
        },
        nextGeneration = function() {
          var i = 0,
              j,
              coordX,
              coordY,
              neighbours;

          prevWorld = _.cloneDeep(world);

          for (; i < options.field.size.rows; i++) {
            for (j = 0; j < options.field.size.columns; j++) {
              neighbours = countLiveNeighbors(i, j);
              coordX = i * cellWidth;
              coordY = j * cellHeight;

              if (prevWorld[i][j]) {
                // Any live cell with more than three live neighbours dies, as if by overcrowding.
                // Any live cell with more than three live neighbours dies, as if by overcrowding.
                if (neighbours < 2 || neighbours > 3) {
                  world[i][j] = 0;
                  liveBeetles--;
                  drawBeetle(coordX, coordY, options.field.backgound.color);
                }
              } else {
                // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                if (neighbours === 3) {
                  world[i][j] = 1;
                  liveBeetles++;
                  drawBeetle(coordX, coordY, options.beetle.color);
                }
              }
            }
          }

          timer = requestAnimFrame(nextGeneration);
        },
        clearBeetles = function() {
          contextBeetles.clearRect(0, 0, options.width, options.height);
          clearCoord();
        };

    init();

    return {
      isReady: function() {
        return status === 'ready';
      },
      isStarted: function() {
        return status === 'started';
      },
      isPaused: function() {
        return status === 'paused';
      },
      isError: function() {
        return status === 'error';
      },
      start: function() {
        if (this.isReady()) {
          setStatusStart();
          nextGeneration();
        }

        return this;
      },
      random: function() {
        var min = maxBeetles * .03, // %
            max = maxBeetles * .15, // %
            num = getRandom(min, max);

        clearBeetles();
        fillBeetles(num);

        return this;
      },
      clear: function() {
        this.stop();
        clearBeetles();

        return this;
      },
      stop: function() {
        if (this.isStarted()) {
          if (timer) {
            cancelRequestAnimFrame(timer);
          }
          setStatusReady();
        }

        return this;
      }
    };
  };
}(this, this._, this.Zepto));

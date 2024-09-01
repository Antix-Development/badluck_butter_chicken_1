// Badluck Butter Chicken (episode 1).
// My 2024 entry for js13k (https://js13kgames.com/).
// By Cliff Earl, Antix Development, 2024 (https://github.com/Antix-Development).

// const log = (t) => console.log(t); // REMOVE FOR PRODUCTION.

// Math variables.
const M = Math;
const min = M.min;
const abs = M.abs;
const cos = M.cos;
const sin = M.sin;
const PI2 = M.PI * 2;

// Screen dimensions.
const WIDTH = 1920;
const HEIGHT = 1080;

const px = 'px';

// Sound effect IDs.
const FX_CLICK      = 0;
const FX_COIN       = 1;
const FX_DEFLECT    = 2;
const FX_SHIELD     = 3;
const FX_MAGNET     = 4;
const FX_BESTSCORE  = 5;
const FX_ALARM      = 6;

// Keyboard variables.
let keysEnabled;
let waitingForKey; // 1 if app is waiting for a new control key to be pressed.
let leftHeld; // Movement flags
let rightHeld;
let controlIndex; // Index of control key to be changed.
let controlLabel; // UI element to change when new control is set.
let CONTROL_LEFT = 0; // Indexes into keyboard control array.
let CONTROL_RIGHT = 1;

// Game modes.
const GAME_MODE_MENUS = 0;
const GAME_MODE_PLAYING = 1;
const GAME_MODE_GAMEOVER = 2;

// Game timing variables.
let DT;
let elapsedTime = 0;
let thisFrame;
let lastFrame;
let paused;
let pauseState;

// UI.
let activeMenu;
let cursorVisible = 1;
let gameMode;

let MULTIPLIER = 1; // Multiplier for velocities used to increase difficulty over time.

// Score management.
let playerScore;
let gotBestScore;
let spawningBestScoreEffects;
let bestScoreEffectsSpawnTimer;
let bestScoreEffectsSpawnCounter;

// Graphical assets.
let textureRegions = []; // Array of texture regions.
let svgString; // String used to generate SVG images, before they are mime encoded and rendered to the `a` canvas.
let SVG_ID = 0; // Used to generate unique filter identities.

// Background clouds that are always displayed.
let clouds = [];
const CLOUD_COUNT = 31;
const FRONT_CLOUD_COUNT = 5;
const MIDDLE_CLOUD_COUNT = 8;
const   cloudPointData = [ //Each cloud point has an x, y, and a radius.
  748, 379, 50, 
  680, 402, 50, 
  718, 96, 50, 
  94, 502, 50, 
  167, 424, 50, 
  196, 374, 50, 
  573, 275, 73, 
  688, 316, 73, 
  697, 461, 73, 
  602, 515, 73, 
  494, 474, 73, 
  686, 197, 73, 
  636, 82, 73, 
  526, 77, 73, 
  467, 117, 73, 
  235, 126, 73, 
  196, 278, 73, 
  238, 485, 73, 
  245, 388, 50, 
  277, 325, 50, 
  277, 243, 50, 
  198, 182, 50, 
  245, 182, 50, 
  267, 57, 50, 
  198, 83, 50, 
  66, 230, 50, 
  54, 182, 50, 
  133, 202, 50, 
  118, 141, 50, 
  174, 533, 50, 
  180, 483, 50, 
  310, 533, 50, 
  341, 483, 50, 
  531, 549, 50, 
  446, 425, 50, 
  470, 167, 50, 
  416, 153, 50
];

// Coin management.
let coinTrailTimer;
let coinSpawnTimer;
let coinPool;
let activeCoins;

let frames = 10; // Number of frames.
let duration = .5; // Duration in seconds.

// Badluck Butter Chicken.
let player;
const playerAcceleration = 150;
const playerMaxVelocity = 1200;
const playerLeanFactor = PI2 * .005;

// Pickups.
let shieldOverlay;

let pickupPool;
let activePickups;

let shielded;
let shieldCounter;
let shieldPickupSpawnTimer;

let magnetized;
let magnetCounter;
let magnetPickupSpawnTimer;
let magnetEffectSpawnTimer;

// Other game entities.
let enemies;

let collisionsEnabled;

let particles;

let renderList;

// Actor types. NOTE: These values are also used for z-sorting.
const ACTOR_TYPE_FARCLOUD       = 0;
const ACTOR_TYPE_SUN            = 1;
const ACTOR_TYPE_NEARCLOUD      = 2;
const ACTOR_TYPE_COIN           = 3;
const ACTOR_TYPE_TOKEN          = 4;
const ACTOR_TYPE_MAGNET_PICKUP  = 5;
const ACTOR_TYPE_SHIELD_PICKUP  = 6;

const ACTOR_TYPE_ENEMY          = 8;
const ACTOR_TYPE_PLAYER         = 9;
const ACTOR_TYPE_SHIELD         = 10;
const ACTOR_TYPE_PARTICLE       = 11;

//#region gl2.js.

// A modified version of gl2.js (https://github.com/Antix-Development/gl2), which in its self is a modified version of gl1.js (https://github.com/curtastic/gl1) (basically I made it a bit smaller).
let 
gl2_gl,
gl2_canvas,
gl2_shaderProgram,
gl2_extension,

gl2_ready,

gl2_jsImage,
gl2_texdestWidth,
gl2_texdestHeight,

gl2_rgbas,
gl2_rotations,
gl2_positions,

gl2_maxDraws = 4e4, // Max amount of images on the screen at the same time. You can set this to any number, it's just the array size.
gl2_draws = 0, // Internal count of images drawn so far this frame.

// Draw the defined rectangular area of the sprite-sheet to the screen at the given coordinates with the given scale, alpha blend, and rotation.
// rgba (optional). You can tint the image for example to green by passing 0x00FF007F. rgba alpha goes from 0 to 127 (0x7F) where 127 is not transparent at all. Higher than 127 will brighten the image more than normal.
// rotation is (optional). In radians. Negative is allowed. Rotated about its center.
gl2_drawImage = (sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, rgba, rotation) => {
  let
    positions = gl2_positions, // Use a local variable so it's faster to access.

    i = gl2_draws * 6;

  // console.log(rgba);

  gl2_rgbas[i + 4] = rgba || 0xFFFFFF7F; // Store rgba after position/texture. Default to white and fully opaque.
  gl2_rotations[i + 5] = rotation || 0; // Store how rotated we want this image to be.

  // Positions array is 2-byte shorts not 4-byte floats so there's twice as many slots.
  i *= 2;

  // Store where we want to draw the image.
  positions[i] = destX;
  positions[i + 1] = destY;
  positions[i + 2] = destWidth;
  positions[i + 3] = destHeight;

  // Store what portion of our PNG we want to draw.
  positions[i + 4] = sourceX;
  positions[i + 5] = sourceY;
  positions[i + 6] = sourceWidth;
  positions[i + 7] = sourceHeight;

  gl2_draws++;
},

// A handy function for when you want to draw rectangles. For example debugging hitboxes, or to darken everything with semi-transparent black overlay. This assumes the top left pixel in your texture is white, so you can stretch/tint it to any size/color rectangle.
gl2_drawRect = (x, y, width, height, rgba, rotation) => gl2_drawImage(0, 0, 1, 1, x, y, width, height, rgba, rotation),

// Call this every frame to actually draw everything onto your canvas. Renders all drawImage calls since the last time you called drawEverything.
gl2_drawEverything = () => {
  gl2_gl.clear(gl2_gl.COLOR_BUFFER_BIT); // Clear the canvas.
  gl2_gl.bufferSubData(gl2_gl.ARRAY_BUFFER, 0, gl2_rgbas.subarray(0, gl2_draws * 6)); // Only send to gl the amount slots in our arrayBuffer that we used this frame.
  gl2_extension.drawElementsInstancedANGLE(gl2_gl.TRIANGLES, 6, gl2_gl.UNSIGNED_BYTE, 0, gl2_draws); // Draw everything. 6 is because 2 triangles make a rectangle.
  gl2_draws = 0; // Go back to index 0 of our arrayBuffer, since we overwrite its slots every frame.
},

// Set the gl canvas background color with the given RGBA values.
gl2_setBackgroundColor = (r, g, b, a) => gl2_gl.clearColor(r, g, b, a),

gl2_setup = (canvas) => {

  gl2_canvas = canvas;

  gl2_gl = canvas.getContext('webgl', { antialias: 0, preserveDrawingBuffer: 1 }); // Get the canvas/context from html.
  // gl2_gl = canvas.getContext('webgl', { antialias: 0, alpha: 0, preserveDrawingBuffer: 1 }); // Get the canvas/context from html.
  gl2_extension = gl2_gl.getExtension('ANGLE_instanced_arrays'); // This extension allows us to repeat the draw operation 6 times (to make 2 triangles) on the same 12 slots in gl2_positions, so we only have to put the image data into gl2_positions once for each image each time we want to draw an image.

  gl2_setBackgroundColor(0, 0, 0, 0); // Set the gl canvas background color.

  let
  byteOffset = 0,

  // Tell gl where read from our arrayBuffer to set our shader attibute variables each time an image is drawn.
  setupAttribute = (name, dataType, amount) => {
    var attribute = gl2_gl.getAttribLocation(shaderProgram, name);
    gl2_gl.enableVertexAttribArray(attribute);
    gl2_gl.vertexAttribPointer(attribute, amount, dataType, 0, bytesPerImage, byteOffset);
    gl2_extension.vertexAttribDivisorANGLE(attribute, 1);
    if (dataType == gl2_gl.SHORT) amount *= 2;
    if (dataType == gl2_gl.FLOAT) amount *= 4;
    byteOffset += amount;
  },

  // Create a shader object of the the given type with the given code.
  createShader = (type, code) => {
    var shader = gl2_gl.createShader(type);
    gl2_gl.shaderSource(shader, code);
    gl2_gl.compileShader(shader);
    return shader;
  },

  // Bind the given buffer of the given type with the given usage.
  bindBuffer = (bufferType, buffer, usage = gl2_gl.STATIC_DRAW) => {
    gl2_gl.bindBuffer(bufferType, gl2_gl.createBuffer());
    gl2_gl.bufferData(bufferType, buffer, usage);
  },

  // Common strings that are reused in the shader code strings
  ATTRIBUTE = 'attribute',
  VARYING = 'varying',
  UNIFORM = 'uniform',

  // Create shaders
  vertShader = createShader(gl2_gl.VERTEX_SHADER, `${ATTRIBUTE} vec2 a;${ATTRIBUTE} vec2 b;${ATTRIBUTE} vec2 c;${ATTRIBUTE} vec4 d;${ATTRIBUTE} vec4 e;${ATTRIBUTE} float f;${VARYING} highp vec2 g;${VARYING} vec4 h;${UNIFORM} vec2 i;${UNIFORM} vec2 j;void main(void){vec2 k;if(f!=0.0){float l=cos(f);float m=sin(f);vec2 n=c*(a-0.5);k=(b+vec2(l*n.x-m*n.y,m*n.x+l*n.y)+c/2.0)/i;}else{k=(b+c*a)/i;}gl_Position=vec4(k.x-1.0,1.0-k.y,0.0,1.0);g=(d.xy+d.zw*a)/j;if(e.x>127.0){float o=pow(2.0,(e.x-127.0)/16.0)/255.0;h=vec4(e.w*o,e.z*o,e.y*o,1.0);}else h=vec4(e.w/255.0,e.z/255.0,e.y/255.0,e.x/127.0);}`), // Each time we draw an image it will run this 6 times. Once for each point of the 2 triangles we use to make the image's rectangle area. The only thing that changes on each repeated draw for the same image is a, so we can get to each corner of the image's rectangle area.
  fragShader = createShader(gl2_gl.FRAGMENT_SHADER, `${VARYING} highp vec2 g;${VARYING} highp vec4 h;${UNIFORM} sampler2D p;void main(void){gl_FragColor=texture2D(p,g)*h;}`),

  // Create a shader program object and attach the shaders.
  shaderProgram = gl2_gl.createProgram();
  gl2_gl.attachShader(shaderProgram, vertShader);
  gl2_gl.attachShader(shaderProgram, fragShader);
  gl2_gl.linkProgram(shaderProgram);
  gl2_gl.useProgram(shaderProgram);
  gl2_shaderProgram = shaderProgram;

  // Tell gl that when we set the opacity, it should be semi transparent above what was already drawn.
  gl2_gl.blendFunc(gl2_gl.SRC_ALPHA, gl2_gl.ONE_MINUS_SRC_ALPHA);
  gl2_gl.enable(gl2_gl.BLEND);
  gl2_gl.disable(gl2_gl.DEPTH_TEST);

  bindBuffer(gl2_gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0, 1, 2, 2, 1, 3])); // Map triangle vertexes to our multiplier array, for which corner of the image drawn's rectangle each triangle point is at.

  bindBuffer(gl2_gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1])); // Our multiplier array for destWidth/destHeight so we can get to each corner of the image drawn.

  // Size multiplier vec2 variable. This code goes here so that it's linked to the Float32Array above, using those values.
  var attribute = gl2_gl.getAttribLocation(shaderProgram, "a");
  gl2_gl.enableVertexAttribArray(attribute);
  gl2_gl.vertexAttribPointer(attribute, 2, gl2_gl.FLOAT, 0, 0, 0);

  var
  shortsPerImagePosition = 2, // Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for position (destX,destY)
  shortsPerImageSize = 2, // Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for size (destWidth,destHeight)
  shortsPerImageTexPos = 4, // Whenever we call our drawImage(), we also store 4 shorts into our arrayBuffer (texX,texY,texdestWidth,texdestHeight)
  bytesPerImageRgba = 4, // Whenever we call our drawImage(), we also store 4 bytes into our arrayBuffer (r,g,b,a) for color and alpha.
  floatsPerImageRotation = 1, // Whenever we call our drawImage(), we also put a float for rotation.
  bytesPerImage = shortsPerImagePosition * 2 + shortsPerImageSize * 2 + shortsPerImageTexPos * 2 + bytesPerImageRgba + floatsPerImageRotation * 4, // Total bytes stored into arrayBuffer per image = 24
  arrayBuffer = new ArrayBuffer(gl2_maxDraws * bytesPerImage); // Make a buffer big enough to have all the data for the max images we can show at the same time.
  gl2_positions = new Int16Array(arrayBuffer); // Make 3 views on the same arrayBuffer, because we store 3 data types into this same byte array. When we store image positions/UVs into our arrayBuffer we store them as shorts (int16's)
  gl2_rotations = new Float32Array(arrayBuffer); // When we store image rotation into our arrayBuffer we store it as float, because it's radians.
  gl2_rgbas = new Uint32Array(arrayBuffer); // When we store image rgbas into our arrayBuffer we store it as 1 4-byte int32.

  bindBuffer(gl2_gl.ARRAY_BUFFER, arrayBuffer, gl2_gl.DYNAMIC_DRAW); // Make the gl vertex buffer and link it to our arrayBuffer. Using DYNAMIC_DRAW because these change as images move around the screen.

  setupAttribute("b", gl2_gl.SHORT, shortsPerImagePosition); // Tell gl that each time an image is drawn, have it read 2 array slots from our arrayBuffer as short, and store them in the vec2 I made "b"
  setupAttribute("c", gl2_gl.SHORT, shortsPerImageSize); // Then read the next 2 array slots and store them in my vec2 "c"
  setupAttribute("d", gl2_gl.SHORT, shortsPerImageTexPos); // Then read the next 4 array slots and store them in my vec4 "d"
  setupAttribute("e", gl2_gl.UNSIGNED_BYTE, bytesPerImageRgba); // Then read the next 4 bytes and store them in my vec4 "e"
  setupAttribute("f", gl2_gl.FLOAT, floatsPerImageRotation); // Then read the next 4 bytes as 1 float and store it in my float "f"
},

// Set the parameter with the given name.
gl2_setTexParameter = (name) => gl2_gl.texParameteri(gl2_gl.TEXTURE_2D, name, gl2_gl.NEAREST),

// Load texture from the given canvas
gl2_loadTexture = (texture) => {
  // Create a gl texture from image file.
  gl2_gl.bindTexture(gl2_gl.TEXTURE_2D, gl2_gl.createTexture());

  gl2_gl.texImage2D(gl2_gl.TEXTURE_2D, 0, gl2_gl.RGBA, gl2_gl.RGBA, gl2_gl.UNSIGNED_BYTE, texture);

  gl2_gl.generateMipmap(gl2_gl.TEXTURE_2D);
  gl2_gl.activeTexture(gl2_gl.TEXTURE0);

  // Tell gl that when draw images scaled up, keep it pixellated and don't smooth it.
  gl2_setTexParameter(gl2_gl.TEXTURE_MAG_FILTER);
  gl2_setTexParameter(gl2_gl.TEXTURE_MIN_FILTER);

  // Store texture size in vertex shader.
  gl2_texdestWidth = texture.width;
  gl2_texdestHeight = texture.height;
  gl2_gl.uniform2f(gl2_gl.getUniformLocation(gl2_shaderProgram, "j"), gl2_texdestWidth, gl2_texdestHeight);

  gl2_gl.viewport(0, 0, gl2_canvas.width, gl2_canvas.height); // Resize the gl viewport to be the new size of the canvas.
  gl2_gl.uniform2f(gl2_gl.getUniformLocation(gl2_shaderProgram, "i"), gl2_canvas.width / 2, gl2_canvas.height / 2); // Update the shader variables for canvas size. Sending it to gl now so we don't have to do the math in JavaScript on every draw, since gl wants to draw at a position from 0 to 1, and we want to do drawImage with a screen pixel position.

  gl2_ready = 1;
};
//#endregion

// #region sound

// This sound system is a modified version of ZzFXM (https://github.com/keithclark/ZzFXM), which also includes ZzFX (https://github.com/.KilledByAPixel/ZzFX).

const menuMusicModule = [
  [ // Instruments.
    [,,22,,.07,.07,2,0,,,.5,.01],
    [,,84,,,,,.7,,,,.5,,6.7,1,.05],
    [,,655,,,.09,3,1.65,,,,,.02,3.8,-.1,,.2],
    [2,,4e3,,,.03,2,1.25,,,,,.02,6.8,-.3,,.5],
    [.75,,386,,,.25,2]
  ],
  [ // Patterns.
    [
      [1,-1,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,29,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,],
      [3,1,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,25.88,29,29.88,25,25.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,25.88,29,29.88,25,29.88,29,29.88,29,25.88,29,29.88,29,29.88],
      [4,-1,13,.02,,.04,,.06,6,.02,,.04,1,.02,3,.02,5,.02,6,.02,,.04,,8,.02,,13,.02,8,.02,10,.02,12,.02,13,.02,,.04,,.06,6,.02,,,1,.02,3,.02,5,.02,6,.02,,.04,,8,.02,,1,.02,,.04,,.06,,.09],
      [,1,25,,,25,,,18,,,,13,,15,,17,,18,,,18,,20,20,,25,,20,,22,,24,,25,,,25,,,18,,,,13,,15,,17,,18,,,18,,20,20,,13,,,,,,,,],
      [2,-1,,,,,25,,,,,,,,25,,,,,,,,25,,,,,,25,,,25,25,,,,,,25,,,,,,,,25,,,,,,25,,25,25,,25,,25,25.14,25,25.13,25,25.11,25.19]
    ],
    [
      [1,-1,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,],
      [3,1,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,25.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,25.88,29,25.88,29,29.88,29,29.88,29,25.88,29,25.88,29,29.88],
      [2,-1,,,,,25,,,,,,,,25,,,,,,,,25,,,,,,25,,25,,,,,,,,25,,,,,,,,25,,,,,,25,,25,,,,,,25,,25,,25,25],
      [,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,13,,17,,20,,]
    ],
    [
      [1,-1,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,29,,,,,,,,],
      [3,1,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,25.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,29.88,29,25.88,29,29.88,29,29.88,29,25.88,29,25.88,29,29.88,29,29.88,29,25.88,29,25.88,29,29.88],
      [2,-1,,,,,25,,,,,,,,25,,,,,,13,,25,,,,,,25,,25,,13,,,,,,25,,,,,,,,25,,,,,,25,,25,,,,,,25,,25,,25,25],
      [2,-1,,,,,,,,,,,,,,,,,,,13,,13.47,,,,13,,13.47,,,,13,,13.47,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
      [2,1,,,,,,,,,,,,,,,,,,,13,,,,13.7,,13,,,,13.7,,,,,,13.92,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
      [,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,13,,17,,20,,]
    ]
  ],
  [1,0,0,2], // Sequence.
  150 // BPM.
];

const gameMusicModule = [
  [ // Instruments.
    [.75,,386,,,.25,2],
    [.75,,386,,,.25,2],
    [.75,,386,,,.25,2],
    [.75,,386,,,.25,2],
    [.75,,386,,,.25,2],
    [.75,,386,,,.25,2]
  ],
  [ // Patterns.
    [
      [1,-1,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,22,,22,,,,,,,,22,,,,,,,,],
      [4,1,25,,,,,,,,,,,,,,,,22,,23,,,,22,,,,23,,23,23.75,23,22,,,18,,,,,,18,,,,15,,17,18,,,,,,,,,,,,,,,20,,],
      [3,-1,6.03,.05,.07,.09,10.03,.05,.07,.09,13.03,.05,.07,.09,15.03,.05,.07,15.03,16.03,.05,.07,.09,15.03,.05,.07,.09,13.03,.05,.07,.09,10.03,.05,.07,.09,6.03,.05,.07,.09,10.03,.05,.07,.09,13.03,.05,.07,.09,15.03,.05,.07,15.03,16.03,.05,.07,.09,15.03,.05,.07,.09,13.03,.05,.07,.09,10.03,.05,.07,.09],
      [4,1,18.08,.16,22.08,.16,25.08,.16,27.08,28.08,27.08,28.08,25.08,.16,22.08,.16,18.08,.16,18,,,,23.75,,18,,22.75,,,.83,23.75,,23.75,23.92,18.08,.16,22.08,.16,25.08,.16,27.08,28.08,27.08,28.08,25.08,.16,22.08,.16,30.08,.16,18,,,,32.08,.16,30.08,.16,34.08,35.08,34.08,35.08,32.08,34.08,30.08,32.08],
      [,-1,,,22,,,,22,22,,,,,,,22,,,,22,,,,22,22,,,22,,,,,,,,22,,,,22,22,,,22,,,,,,,,22,,,,,,,,22,,,,,,],
      [2,-1,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,22,22],
      [5,1,,,,,,,,,,,,,,,,,,18,18,,,,,18,,,,,,,,,,,,,,,,,,,,,,,,,,18,18,,,,,,,,,,,,,,],
      [4,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,18,,,,,,,,,,],
      [5,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,18,,,,,,,,,]
    ],
    [
      [1,-1,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,22,,22,,,,,,,,22,,,,,,,,],
      [4,1,23,,,,,,,,,,,,28.75,27,28,27,28,27,28,27,28,27,28,27,28,27,28,27,28,27,28,27,25,,,,,,,,,,,,,,,,,,,,,,,,,,27,,25,,,,],
      [3,-1,11.03,.05,.07,.09,15.03,.05,.07,.09,18.03,.05,.07,.09,20.03,.05,.07,20.03,21.03,.05,.07,.09,20.03,.05,.07,.09,18.03,.05,.07,.09,15.03,.05,.07,.09,6.03,.05,.07,.09,10.03,.05,.07,.09,13.03,.05,.07,.09,15.03,.05,.07,15.03,16.03,.05,.07,.09,15.03,.05,.07,.09,13.03,.05,.07,.09,10.03,.05,.07,.09],
      [4,1,30.08,.16,23.75,,,,30.08,32.08,.16,.24,30.08,.16,.24,.32,35.08,.16,23,,32.08,.16,28.92,27.92,30.08,.16,28.92,27.92,30.08,27.08,25.08,22.08,18.08,20.08,18.08,.16,25.75,,,,,,,,,,,,,,18,,,,,,18,,25.08,.16,.24,.32,27.08,.16,25.08,.16],
      [,-1,,,22,,,,22,22,,,,,,,22,,,,,,,,,,,,22,,,,,,,,22,,,,22,22,,,22,,,,,,,,22,,,,22,22,,,22,,,,,,],
      [2,-1,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,22,22],
      [5,1,,,,,,,,,,,,,,,,,,23,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,18,18,,.08,.16,,18,,,,,,,,,],
      [5,-1,,,,,,,,,,,,,,,,,,,23,,,,,23,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
      [4,-1,,,,,,,,,,,,,,,,,,,,,,,23,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]
    ],
    [
      [1,-1,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,22,,22,,,,,,,,22,,,,,,,,],
      [4,1,29,,,,27,29,,,27,29,28,,,,26,27,,,,,,,,,,,27,.75,25,,,,29,,,,27,29,,,27,29,28,,,,27,,,,,,,,,,,,25,,,,,,],
      [3,-1,13.03,.05,.07,.09,17.03,.05,.07,.09,20.03,.05,.07,.09,22.03,.05,.07,22.03,23.03,.05,.07,.09,22.03,.05,.07,.09,20.03,.05,.07,.09,17.03,.05,.07,.09,13.03,.05,.07,.09,17.03,.05,.07,.09,20.03,.05,.07,.09,22.03,.05,.07,22.03,23.03,.05,.07,.09,22.03,.05,.07,.09,20.03,.05,.07,.09,17.03,.05,.07,.09],
      [4,1,29.08,.16,29.75,,27.08,25.08,.16,.24,29.08,.16,27.08,28.08,27.08,28.08,27.08,.16,25,,,,,,25,,,,25.08,.16,27.08,.16,25.08,.16,29.08,.16,29.75,,27.08,25.08,.16,.24,29.08,.16,27.08,28.08,27.08,28.08,27.08,.16,25,,,,25.08,.16,27.08,.16,25.08,27.08,25.08,22.08,23.08,22.08,23.08,22.08],
      [,-1,,,22,,,,22,22,,,,,,,22,,,,22,,,,22,22,,,22,,,,,,,,22,,,,22,22,,,22,,,,,,,,22,,,,,,,,22,,,,,,],
      [2,-1,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,22,22],
      [5,1,,,,,,,,,,,,,,,,,,25,25,,.08,.16,,25,.09,.17,,,,,,,,,,,,,,,,,,,,,,,,25,25,,,,,,,,,,,,,,],
      [4,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,25,,,,,,,,,,],
      [5,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,25,,,,,,,,,]
    ],
    [
      [1,-1,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,22,,22,,,,,,,,22,,,,,,,,],
      [4,1,18,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
      [3,-1,6.03,.05,.07,.09,10.03,.05,.07,.09,13.03,.05,.07,.09,15.03,.05,.07,15.03,16.03,.05,.07,.09,15.03,.05,.07,.09,13.03,.05,.07,.09,10.03,.05,.07,.09,6.03,.05,.07,.09,10.03,.05,.07,.09,13.03,.05,.07,.09,15.03,.05,.07,15.03,16.03,.05,.07,.09,15.03,.05,.07,.09,13.03,.05,.07,.09,10.03,.05,.07,.09],
      [4,1,18.08,.16,18.75,,,,,,,,,,,,,,22,23.08,22.08,23.08,22.08,23.08,22.08,23.08,22.08,23.08,22.08,23.08,22.08,23.08,22.08,23.08,18.08,.16,.24,.32,.4,.48,.56,.64,.72,.8,.88,.96,,,,,18,,,,,,18,,,,,,,,,,],
      [,-1,,,22,,,,22,22,,,,,,,22,,,,22,,,,22,22,,,22,,,,,,,,22,,,,22,22,,,22,,,,,,,,22,,,,22,22,,,,,,,,,],
      [2,-1,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,,,22,,22,,,,,,22,,,,,,,,22,,,,,,,,22,,,,,,22,,22,,22,22],
      [5,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,18,18,,.08,.16,,18,.08,.16,.24,.32,.4,.48,.56,.64]
    ]
  ],
  [0,1,2,3], // Sequence.
  187.5 // BPM.
];

const gameOverMusicModule = [
  [ // Instruments.
    [2,0,426,,.02,.2,,44,,,200,,,.1]
  ],
  [ // Patterns.
    [
      [,1,20,,,,19,,,,18,,,,17,,,,16,,,,,,,,,,,,,,,.99,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
      [,-1,13,,,,12,,,,11,,,,10,,,,9,,,,,,,,,,,,,,,.99,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
      [,1,23,,,,22,,,,21,,,,20,,,,19,,,,,,,,,,,,,,,.99,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]
    ]
  ],
  [0], // Sequence.
  125 // BPM.
];

let sounds = [];
let musicToStop = [];
let renderingInstrument;

// ZzFX by Frank Force (modified).

let zzfxVolume = 1;

let zzfxAudioContext;

const zzfxSampleRate = 44100;

// Create the `AudioContext` object which enables audio output.
const createAudioContext = e => {
  zzfxAudioContext = new AudioContext();
  enableAudio(OPTIONS.audio);
};

// Play an array of samples.
const playSamples = (...samples) => {

  const audioBuffer = zzfxAudioContext.createBuffer(samples.length, samples[0].length, zzfxSampleRate);
  const audioBufferSourceNode = zzfxAudioContext.createBufferSource();
  const gainNode = zzfxAudioContext.createGain();

  samples.map((d, i) => audioBuffer.getChannelData(i).set(d));
  audioBufferSourceNode.buffer = audioBuffer;
  audioBufferSourceNode.connect(gainNode); // `AudioBufferSourceNode` is connected to a `GainNode`
  gainNode.connect(zzfxAudioContext.destination); // `GainNode` is connected to the `AudioContext` for granular volume control.
  audioBufferSourceNode.start();

  return [audioBufferSourceNode, gainNode];
};

// Build an array of samples.
const newSound = (
    volume = 1,
    randomness = 0,
    frequency = 220,
    attack = 0,
    sustain = 0,
    release = .1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = 1,
    decay = 0,
    tremolo = 0,
    filter = 0) => {

    // init parameters
    // let PI2 = M.PI * 2,
    let sign = v => v < 0 ? -1 : 1,
    sampleRate = zzfxSampleRate,
    startSlide = slide *= 500 * PI2 / sampleRate / sampleRate,
    startFrequency = frequency *= PI2 / sampleRate,
//        (1 + randomness * 2 * M.random() - randomness) * PI2 / sampleRate,
    samples = [],
    t = 0,
    tm = 0,
    i = 0,
    j = 1,
    r = 0,
    c = 0,
    s = 0,
    f,
    length,

    // biquad LP/HP filter
    quality = 2,
    w = PI2 * abs(filter) * 2 / sampleRate,
    cosine = cos(w),
    alpha = sin(w) / 2 / quality,
    a0 = 1 + alpha,
    a1 = -2 * cosine / a0,
    a2 = (1 - alpha) / a0,
    b0 = (1 + sign(filter) * cosine) / 2 / a0,
    b1 =  - (sign(filter) + cosine) / a0,
    b2 = b0,
    x2 = 0,
    x1 = 0,
    y2 = 0,
    y1 = 0;

    // scale by sample rate
    attack = attack * sampleRate + 9; // minimum attack to prevent pop
    decay *= sampleRate;
    sustain *= sampleRate;
    release *= sampleRate;
    delay *= sampleRate;
    deltaSlide *= 500 * PI2 / sampleRate ** 3;
    modulation *= PI2 / sampleRate;
    pitchJump *= PI2 / sampleRate;
    pitchJumpTime *= sampleRate;
    repeatTime = repeatTime * sampleRate | 0;
    volume *= zzfxVolume;

    // generate waveform
    for (length = attack + decay + sustain + release + delay | 0; i < length; samples[i++] = s * volume) { // sample

      if (!(++c % (bitCrush * 100 | 0))) { // bit crush
            s = shape ? shape > 1 ? shape > 2 ? shape > 3 ? // wave shape
                sin(t ** 3) : // 4 noise
                M.max(min(M.tan(t), 1), -1) : // 3 tan
                1 - (2 * t / PI2 % 2 + 2) % 2 : // 2 saw
                1 - 4 * abs(M.round(t / PI2) - t / PI2) : // 1 triangle
                sin(t); // 0 sin

            s = (repeatTime ?
                1 - tremolo + tremolo * sin(PI2 * i / repeatTime) // tremolo
                 : 1) *
            sign(s) * (abs(s) ** shapeCurve) * // curve
            (i < attack ? i / attack : // attack
                i < attack + decay ? // decay
                1 - ((i - attack) / decay) * (1 - sustainVolume) : // decay falloff
                i < attack + decay + sustain ? // sustain
                sustainVolume : // sustain volume
                i < length - delay ? // release
                (length - i - delay) / release * // release falloff
                sustainVolume : // release volume
                0); // post release

            s = delay ? s / 2 + (delay > i ? 0 : // delay
                    (i < length - delay ? 1 : (length - i) / delay) * // release delay
                    samples[i - delay | 0] / 2 / volume) : s; // sample delay

            if (filter) s = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = s) - a2 * y2 - a1 * (y2 = y1); // apply filter
        }

        f = (frequency += slide += deltaSlide) * // frequency
        cos(modulation * tm++); // modulation
        t += f + f * noise * sin(i ** 5); // noise

        if (j && ++j > pitchJumpTime) { // pitch jump
            frequency += pitchJump; // apply pitch jump
            startFrequency += pitchJump; // also apply to start
            j = 0; // stop pitch jump time
        }

        if (repeatTime && !(++r % repeatTime)) { // repeat
            frequency = startFrequency; // reset frequency
            slide = startSlide; // reset slide
            j = j || 1; // reset pitch jump time
        }
    }

    if (!renderingInstrument) {
      sounds.push({
        samples
      });
    }

    return samples;
};

// ZzFX Music Renderer v2.0.3 by Keith Clark and Frank Force (modified).
const renderMusic = (instruments, patterns, sequence, BPM = 125) => {
  renderingInstrument = 1;

  let instrumentParameters;
  let i;
  let j;
  let k;
  let note;
  let sample;
  let patternChannel;
  let notFirstBeat;
  let stop;
  let instrument;
  let pitch;
  let attenuation;
  let outSampleOffset;
  let isSequenceEnd;
  let sampleOffset = 0;
  let nextSampleOffset;
  let sampleBuffer = [];
  let leftChannelBuffer = [];
  let rightChannelBuffer = [];
  let channelIndex = 0;
  let panning = 0;
  let hasMore = 1;
  let sampleCache = {};
  let beatLength = zzfxSampleRate / BPM * 60 >> 2;

  // for each channel in order until there are no more
  for(; hasMore; channelIndex++) {

    // reset current values
    sampleBuffer = [hasMore = notFirstBeat = pitch = outSampleOffset = 0];

    // for each pattern in sequence
    sequence.map((patternIndex, sequenceIndex) => {
      // get pattern for current channel, use empty 1 note pattern if none found
      patternChannel = patterns[patternIndex][channelIndex] || [0, 0, 0];

      // check if there are more channels
      hasMore |= !!patterns[patternIndex][channelIndex];

      // get next offset, use the length of first channel
      nextSampleOffset = outSampleOffset + (patterns[patternIndex][0].length - 2 - !notFirstBeat) * beatLength;
      // for each beat in pattern, plus one extra if end of sequence
      isSequenceEnd = sequenceIndex == sequence.length - 1;
      for (i = 2, k = outSampleOffset; i < patternChannel.length + isSequenceEnd; notFirstBeat = ++i) {

        // <channel-note>
        note = patternChannel[i];

        // stop if end, different instrument or new note
        stop = i == patternChannel.length + isSequenceEnd - 1 && isSequenceEnd ||
            instrument != (patternChannel[0] || 0) | note | 0;

        // fill buffer with samples for previous beat, most cpu intensive part
        for (j = 0; j < beatLength && notFirstBeat;

            // fade off attenuation at end of beat if stopping note, prevents clicking
            j++ > beatLength - 99 && stop ? attenuation += (attenuation < 1) / 99 : 0
        ) {
          // copy sample to stereo buffers with panning
          sample = (1 - attenuation) * sampleBuffer[sampleOffset++] / 2 || 0;
          leftChannelBuffer[k] = (leftChannelBuffer[k] || 0) - sample * panning + sample;
          rightChannelBuffer[k] = (rightChannelBuffer[k++] || 0) + sample * panning + sample;
        }

        // set up for next note
        if (note) {
          // set attenuation
          attenuation = note % 1;
          panning = patternChannel[1] || 0;
          if (note |= 0) {
            // get cached sample
            sampleBuffer = sampleCache[
              [
                instrument = patternChannel[sampleOffset = 0] || 0,
                note
              ]
            ] = sampleCache[[instrument, note]] || (
                // add sample to cache
                instrumentParameters = [...instruments[instrument]],
                instrumentParameters[2] *= 2 ** ((note - 12) / 12),

                // allow negative values to stop notes
                note > 0 ? newSound(...instrumentParameters) : []
            );
          }
        }
      }

      // update the sample offset
      outSampleOffset = nextSampleOffset;
    });
  }

  renderingInstrument = 0;

  return [leftChannelBuffer, rightChannelBuffer];
};

// Play the sound with the given id.
const playSound = id => {
  const sound = sounds[id];
  const oldGainNode = sound.gainNode;

  const [buffer, gainNode] = playSamples(sound.samples);

  sound.buffer = buffer;
  sound.gainNode = gainNode;

  if(oldGainNode) oldGainNode.gain.linearRampToValueAtTime(0, zzfxAudioContext.currentTime + .01); // Fade to no volume over .01 seconds.
};

// Play the given music object.
const playMusic = musicObject => {

  let samples = musicObject.samples;
  // if (!samples) samples = renderMusic(...musicObject.module);

  const [buffer, gainNode] = playSamples(...samples);

  gainNode.gain.value = 0;
  gainNode.gain.linearRampToValueAtTime(.10, zzfxAudioContext.currentTime + 1); // Fade to full volume over 1 second.

  buffer.loop = musicObject.loop;

  musicObject.buffer = buffer;
  musicObject.gainNode = gainNode;
  musicObject.samples = samples;
};

// Stop the given music object.
const stopMusic = musicObject => {
  musicObject.gainNode.gain.linearRampToValueAtTime(0, zzfxAudioContext.currentTime + 1); // Fade to silent over .01 seconds.
  musicObject.timer = 1; // The music will be stopped after 1 second.
  musicToStop.push(musicObject);
};

// Enable the audio according to the given state.
const enableAudio = state => {
  if (zzfxAudioContext) (state && OPTIONS.audio) ? zzfxAudioContext.resume() : zzfxAudioContext.suspend();
};

const menuMusicObject = {module: menuMusicModule, loop: 1};
const gameMusicObject = {module: gameMusicModule, loop: 1};
const gameOverMusicObject = {module: gameOverMusicModule, loop: 0};

menuMusicObject.samples = renderMusic(...menuMusicObject.module);
gameMusicObject.samples = renderMusic(...gameMusicObject.module);
gameOverMusicObject.samples = renderMusic(...gameOverMusicObject.module);

// #endregion

// #region localstorage

let OPTIONS; // Persistent data buffer.

const NAMESPACE = 'com.antix.bbc1'; // Persistent data filename.

// Save options to local storage.
const saveOptions = () => localStorage.setItem(NAMESPACE, JSON.stringify(OPTIONS));

// Reset options to default and save them to local storage.
const resetOptions = () => {
  OPTIONS = {
    best: 5000, // Top score.
    audio: 1, // Audio enabled.
    controls: [ // Controls.
      { // Left.
        code: 'KeyZ' // Ascii representation.
      },
      { // Right.
        code: 'KeyX'
      }
    ]
  };

  saveOptions(); // Save options to local storage.
};

// #endregion

// #region -- prng

// xorshift32.
let randomState = performance.now();//135724680;

// Call random() for a float, and random(max) for an integer between 0 and max.
const random = max => {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  let result = (randomState >>> 0) / 4294967296 * (max | 1);
  return (!max) ? result : ~~result;
};

// Get a random integer in the given range.
const randomInt = (min, max) => ((random(max) + min));

// #endregion

// Constrain the given value to the given range.
const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

// Functions that return strings representing SVG elements (or attributes) with the given parameters.
const SVG_HEAD = (w, h) => `<svg width="${w}" height="${h}" version="1.1" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
const SVG_FILL_WITH_COLOR_OR_URL = (fill) => ((fill.match(/[G-Z]/g)) ? `fill="url(#${fill})"` : `fill="#${fill}"`); // Fills with color or url.
const SVG_RECT = (x, y, w, h, fill, rx = 0, ry = rx, strokeWidth = 0, stroke = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${(SVG_FILL_WITH_COLOR_OR_URL(fill))} rx="${rx}" ry="${ry}" stroke-width="${strokeWidth}" stroke="#${stroke}"/>`;
const SVG_PATH = (path, fill, strokeWidth = 0, stroke = '0000') => `<path d="${path}" fill="#${fill}" stroke-width="${strokeWidth}" stroke="#${stroke}"/>`;
const SVG_TEXT = (x, y, text, color, size) => `<text x="${x}" y="${y}" fill="#${color}" font-family="Arial" font-size="${size}px" font-weight="900">${text}</text>`;
const SVG_CIRCLE = (x, y, r, fill = 'fff') => `<circle cx="${x}" cy="${y}" r="${r}" fill="#${fill}"/>`;
const SVG_RADIALGRADIENT = (x, y, r, color1, opacity1, offset1, color2, opacity2, offset2)  => (`<radialGradient id="Z${++SVG_ID}" cx="${x}" cy="${y}" r="${r}" gradientUnits="userSpaceOnUse">` + SVG_GRADIENT_COLOR_STOP(color1, opacity1, offset1) + SVG_GRADIENT_COLOR_STOP(color2, opacity2, offset2) + `</radialGradient>`);
const SVG_GRADIENT_COLOR_STOP = (color, opacity, offset) => (`<stop stop-color="#${color}" stop-opacity="${opacity}" offset="${offset}"/>`);

// Show or hide the mouse cursor according to the given state.
const showCursor = state => {
  if (state) {
    if (!cursorVisible) b.style.cursor = 'pointer'; // Only show the cursor if it is not visible
      
  } else {
    if (cursorVisible) b.style.cursor = 'none'; // Only hide the cursor if it is visible

  }
  cursorVisible = state; // Save the state
};

// HTML element types.  
const TYPE_DIV    = 0;
const TYPE_BUTTON = 1;
const TYPE_H1     = 2;
const TYPE_H2     = 3;
const TYPE_H3     = 4;
const TYPE_H4     = 5;
const TYPE_H5     = 6;
const TYPE_H6     = 7;

// Create a new HTML element of the given type.
const createElement = (id, type) => {
  const el = document.createElement(['div', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'][type | 0]);
  if (id) el.id = id;
  return el;
};

// Set the position of the given element to the given coordinates.
const setElementPosition = (el, left, top) => {el.style.left = left + px; el.style.top = top + px};

// Add the `centered` class to the given element causing it's text to be centered.
const centerElement = el => el.classList.add('centered');

// Append the given element to the given other element.
const appendElementTo = (el, other) => other.appendChild(el);

// Set the size of the given element to the given dimensions.
const setElementSize = (el, width, height) => {el.style.width = width + px; el.style.height = height + px};

// Set the background color of the given element to the given color.
const setElementBackgroundColor = (el, color) => el.style.backgroundColor = `#` + color;

// Set the given HTML elements innerHTML to the given HTML
const setHTML = (el, html) => el.innerHTML = html;

// Set the text for the given text button to the given text.
const setButtonLabel = (el, t) => el.firstElementChild.innerHTML = t;

// Create a new text label with the given parameters.
const newTextLabel = (size, text, x, y, id) => {
  const heading = createElement(id, size);
  heading.innerHTML = text;
  setElementPosition(heading, x, y);
  return heading;
};

// Create a new text button with the given parameters.
const newTextButton = (x, y, w, h, text, color, callback, id) => {
  const button = createElement(id, TYPE_BUTTON);

  const label = createElement('', TYPE_H4);
  label.innerHTML = text;
  appendElementTo(label, button);

  button.style.width = w + px; button.style.height = h + px;
  button.style.backgroundColor = '#' + color;
  setElementPosition(button, x, y);

  button.onclick = e => {
    callback();
    playSound(FX_CLICK); // Play after executing callback so that it plays correctly when toggling audio on and off.
  };

  return button;
};

// Open the given menu.
const openMenu = (menu) => {
  // Hide current menu.
  activeMenu.classList.toggle('menu-visible');

  // Show the desired menu and make it the active one.
  if (menu) menu.classList.toggle('menu-visible');
  activeMenu = menu;
};

// Award the given number of points to the player and handle cases where best score was reached in this game.
const awardPoints = (n) => {
  playerScore += n;
  setHTML(playerScoreLabel, playerScore.toLocaleString());
  if (!gotBestScore) {

    if (playerScore > OPTIONS.best) {

      gotBestScore = 1;
      spawningBestScoreEffects = 1;
      playSound(FX_BESTSCORE);

    }
  }
};

// Create a new actor object with the given attributes.
const newActor = (type, x, y, vx, vy, texture, radius, alpha, scale, angle, rotationRate, ttl, gx, gy, fades, shrinks) => ({
  type,

  x,
  y,
  vx,
  vy,

  texture,

  radius,

  alpha,
  scale,

  angle,
  rotationRate,

  ttl,

  gx,
  gy,

  fades,
  shrinks,

  counter: ttl,
  originalScale: scale,

  originalAlpha: alpha,

  collides: 1,
});

// Spawn a particle using the given parameters.
const newParticle = (ttl, x, y, angle, texture, speed, fades, alpha, shrinks, scale, rotationRate, gx = 0, gy = 0) => {

  const particle = newActor(
    ACTOR_TYPE_PARTICLE, // type
    x, // x
    y, // y
    cos(angle) * speed, // vx
    sin(angle) * speed, // vy
    getTextureRegion(texture), // texture
    1, // radius
    alpha, // alpha
    scale, // scale
    angle, // rotation
    rotationRate, // rotationRate
    ttl, // ttl
    gx, // gx
    gy, // gy
    fades,  // fades
    shrinks, // shrinks
  );

  particle.originalAlpha = alpha;
  particle.originalScale = scale;
  particles.push(particle);
};

// Spawn a shower of star particle effect at the given actors position, with the given number of stars.
const spawnStarShower = (actor, n) => {
  for (let k = n; k--;) {
    newParticle(
      1, // ttl
      actor.x, // x
      actor.y, // y
      random() * PI2, // angle
      'star', // texture
      500 + randomInt(50, 250), // speed
      1, // fades
      1, // alpha
      1, // shrinks
      .5 + random() * .5, // scale
      0, // rotationRate
      0, // gx
      15 + randomInt(10, 20) // gy
    );
  }
};

// Spawn a shower of coin particles at the given actors position.
const spawnCoinShower = (actor, n) => {
  for (let k = 0; k < n; k++) {
    newParticle(
      3, // ttl
      actor.x, // x
      actor.y, // y
      PI2 * .3 - (random() * PI2 * .15), // angle
      'coin0', // texture
      900 + randomInt(50, 250), // speed
      1, // fades
      1, // alpha
      1, // shrinks
      .35 + random() * .5, // scale
      0, // rotationRate
      0, // gx
      -(70 + randomInt(10, 20)) // gy
    );
  }
};

const randomXPosition = e => randomInt(64, WIDTH - 64);
const randomYPosition = e => (-randomInt(144, HEIGHT));
const randomFallSpeed = e => (randomInt(123, 234));

// The player clicked the button so we can now create an `AudioContext`, start the menu music, and open the main menu.
const pregameButtonClicked = e => {
  createAudioContext(); // Create the `AudioContext` required to play sound.
  playMusic(menuMusicObject);
  openMenu(m);
};

// Reset game state and begin game.
const playButtonClicked = e => {

  stopMusic(menuMusicObject);
  playMusic(gameMusicObject);

  // Reset magnet pickup.
  magnetized = 0;
  magnetCounter = 0;
  setHTML(magnetCounterLabel, magnetCounter);
  magnetPickupSpawnTimer = 3 + random(); // Time till first ingame spawn.

  // Reset shield pickup.
  shieldCounter = 0;
  setHTML(shieldCounterLabel, shieldCounter);
  shieldPickupSpawnTimer = 6 + random();  // Time till first ingame spawn.

  // Create the shield graphic overlay.
  shieldOverlay = newActor(
    ACTOR_TYPE_SHIELD, // type
    0,
    HEIGHT - 100, // y
    0, // vx
    0,
    getTextureRegion('shield'),
    0,
    1,
    1,
    0,
  );

  // Reset "achieved best score" variables.
  gotBestScore = 0;
  spawningBestScoreEffects = 0;
  bestScoreEffectsSpawnTimer = 0;
  bestScoreEffectsSpawnCounter = 10;

  // Reset coins.
  coinPool = Array.from({ length: 100 }, () => newActor(
    ACTOR_TYPE_COIN,
    0,
    0,
    0,
    450,
    getTextureRegion('coin0'),
    48,
    1,
    1,
    0,
  ));
  activeCoins = new Set();
  coinTrailTimer = randomInt(1, 3);
  coinSpawnTimer = .5;

  enemies = [];

  for (let i = 13; i--;) {
    const enemy = newActor(ACTOR_TYPE_ENEMY, (i * 144) + 72, -randomInt(144, HEIGHT), 0, randomFallSpeed(), getTextureRegion('enemy'), 48, 1, 1, random() * PI2, (random() < .5) ? -PI2 * .005 : PI2 * .005);
    enemies.push(enemy);
    enemy.lane = i;
  }

  elapsedTime = 0;
  playerScore = 0;
  gotBestScore = 0;

  MULTIPLIER = 1;

  setHTML(playerScoreLabel, playerScore.toLocaleString());

  // Create the player.
  player = newActor(
    ACTOR_TYPE_PLAYER, // type
    WIDTH / 2,
    HEIGHT - 96, // y
    0, // vx
    0,
    getTextureRegion('chicky'),
    48,
    1,
    1,
    0,
    0
  );
  player.gy = 0;

  gameMode = GAME_MODE_PLAYING;

  keysEnabled = 1;

  collisionsEnabled = 1;

  openMenu(g);
  showCursor(0);
};

// Open the options menu.
const optionsButtonClicked = e => {
  openMenu(o);
};

// Toggle audio output.
const audioButtonClicked = e => {
  if (!paused) {
    setElementBackgroundColor(audioButton, ((OPTIONS.audio = !OPTIONS.audio)) ? '8c2' : '888');
    enableAudio(OPTIONS.audio);
    showCursor(0);
  }
};

// Toggle game paused state.
const pauseButtonClicked = e => {
  setElementBackgroundColor(pauseButton, ((paused = !paused)) ? '888' : '8c2');
  enableAudio(!paused);
  lastFrame = Date.now();
  showCursor(0);
};

const toggleAudioButtonClicked = e => {
  resetKeyButtons();
  mutateAudioButton((OPTIONS.audio = !OPTIONS.audio));

};
const resetKeyButtons = e => {
  setButtonLabel(setKeyLeftButton, OPTIONS.controls[CONTROL_LEFT].code);
  setButtonLabel(setKeyRightButton, OPTIONS.controls[CONTROL_RIGHT].code);
  waitingForKey = 0;
  controlLabel = null;
}

const setKeyForLeft = e => {
  resetKeyButtons();
  controlLabel = setKeyLeftButton;
  controlIndex = CONTROL_LEFT;
  setButtonLabel(setKeyLeftButton, 'Press Key');
  waitingForKey = 1;
};

const setKeyForRight = e => {
  resetKeyButtons();
  controlLabel = setKeyRightButton;
  controlIndex = CONTROL_RIGHT;
  setButtonLabel(setKeyRightButton, 'Press Key');
  waitingForKey = 1;
};

// Close the options menu, save the options, then open the main menu.
const optionsOkayButtonClicked = e => {
  resetKeyButtons();
  saveOptions();
  openMenu(m);
};

// Change the color and text of the audio toggle button and enable audio playback, according to the given state.
const mutateAudioButton = state => {
  setElementBackgroundColor(toggleAudioButton, (state) ? '8c2' : '888');
  setButtonLabel(toggleAudioButton, (state) ? 'ON' : 'OFF');
  
  enableAudio(state);
};
   
// Create a new texture region with the given attributes and draw the SVG image to the texture atlas canvas at the given coordinates and scaled to the given scale.
const newTextureRegion = (name, x, y, scale = 1) => {
  let image = new Image();
  image.onload = () => { // When the image has loaded...

    if (name) { // Name was passed, create a new `TextureRegion`.

      let 
      w = image.width * scale,
      h = image.height * scale;

      a.getContext('2d').drawImage(image, x, y, w, h); // draw image to the textureAtlas.
      textureRegions[name] = { x, y, w, h }; // Create new texture region.

      image.id = name;
      appendElementTo(image, u);
      setElementPosition(image, x, y);

      // log(`newTextureRegion() ${name} ${x},${y},${w},${h}`);

    } else { // No name passed, all assets have been generated.

      gl2_loadTexture(a); // Initialize webGL texture.

      allAssetsLoaded(); // Initialize other game vars and start menus.

    }
  }
  image.src = `data:image/svg+xml;base64,${btoa(svgString + '</svg>')}`; // Encode the SVG and set it to the images source (start it loading) .
},

// Get the texture region with the given name.
getTextureRegion = (name) => (textureRegions[name]);

// Initialize menus and other stuff, open the pre game menu, and start main game loop.
const allAssetsLoaded = e => {

  // 
  // Create parallax clouds.
  // 

  for (let i = 0; i < CLOUD_COUNT; i++) {

    // Parameters for back clouds.
    let 
    x = random(WIDTH),
    y = random(HEIGHT),
    scale = .5,
    vy = random(10) + 10,
    alpha = .025,
    type = ACTOR_TYPE_FARCLOUD,
    texture = getTextureRegion('cloud');

    // Parameters for sun.
    if (i === CLOUD_COUNT - 1) {
      x = 1620;
      y = 290;
      scale = 1;
      alpha = 1;
      vy = 0;
      type = ACTOR_TYPE_SUN;
      texture = getTextureRegion('sun');

    // Parameters for front clouds.
    } else if (i > (CLOUD_COUNT - 1) - FRONT_CLOUD_COUNT) {
      scale = 1;
      alpha = .040;
      vy *= 6;
      type = ACTOR_TYPE_NEARCLOUD;

      // Parameters for middle clouds.
    } else if (i > (CLOUD_COUNT - 1) - (MIDDLE_CLOUD_COUNT + FRONT_CLOUD_COUNT)) {
      scale = .75;
      alpha = .030;
      vy *= 3;
    }

    // Add the cloud (or sun).
    clouds.push({
      x,
      y,
      vy,
      scale,
      alpha,
      type,
      angle: 0,
      texture,
    });
  }

  // 
  // Create the pre game menu.
  // 

  // appendElementTo(newTextLabel(TYPE_H2, 'BadLuck', 60, 60), v);
  appendElementTo(newTextButton(560, 430, 800, 220, 'Click Me', 'bbc', pregameButtonClicked), v);
  
  // 
  // 
  // Create the main menu.
  // 

  appendElementTo(newTextLabel(TYPE_H2, 'BadLuck', 60, 60), m);
  appendElementTo(newTextLabel(TYPE_H3, 'Butter', 182, 232), m);
  appendElementTo(newTextLabel(TYPE_H2, 'Chicken', 460, 220), m);
  appendElementTo(newTextLabel(TYPE_H6, 'Flies The Unfriendly Skies', 565, 430), m);
  appendElementTo(chicky, m); // Move from assets container to main menu.
  setElementPosition(chicky, 990, 60);
  chicky.style.transform = 'rotate(45deg)';
  appendElementTo(newTextLabel(TYPE_H5, 'TOP SCORE', 765, 530), m);
  appendElementTo(newTextLabel(TYPE_H5, '1,000', 0, 610, 'topScoreLabel'), m);
  updateBestScoreLabel();
  centerElement(topScoreLabel);
  appendElementTo(newTextButton(64, 525, 500, 450, 'PLAY', '8c2', playButtonClicked), m);
  appendElementTo(newTextButton(970, 764, 760, 210, 'OPTIONS', '3bd', optionsButtonClicked), m);

  // 
  // Create options menu.
  // 

  appendElementTo(newTextLabel(TYPE_H3, 'OPTIONS', 0, 40, 'optionsTitle'), o);
  centerElement(optionsTitle);
  appendElementTo(newTextLabel(TYPE_H3, "PLAY SOUND", 250, 230), o);
  appendElementTo(newTextLabel(TYPE_H3, "MOVE LEFT", 250, 450), o);
  appendElementTo(newTextLabel(TYPE_H3, "MOVE RIGHT", 250, 670), o);
  appendElementTo(newTextButton(1080, 200, 550, 140, '', '8c2', toggleAudioButtonClicked, 'toggleAudioButton'), o);
  mutateAudioButton(OPTIONS.audio);
  appendElementTo(newTextButton(980, 420, 740, 140, '', 'db3', setKeyForLeft, 'setKeyLeftButton'), o);
  appendElementTo(newTextButton(980, 640, 740, 140, '', 'db3', setKeyForRight, 'setKeyRightButton'), o);
  appendElementTo(newTextButton(64, 820, 400, 160, 'OKAY', '8c2', optionsOkayButtonClicked), o);
  resetKeyButtons();

  // 
  // Create ingame menu.
  // 

  appendElementTo(newTextLabel(TYPE_H3, '1,000', 0, 32, 'playerScoreLabel'), g);
  centerElement(playerScoreLabel);
  appendElementTo(newTextButton(32, 24, 110, 160, '\u2016', '8c2', pauseButtonClicked, 'pauseButton'), g);
  appendElementTo(newTextButton(1744, 24, 120, 160, '\u266b', '8c2', audioButtonClicked, 'audioButton'), g);
  setElementBackgroundColor(audioButton, (OPTIONS.audio) ? '8c2' : '888');
  appendElementTo(magnetPickup, g);
  setElementPosition(magnetPickup, 250, 32);
  appendElementTo(newTextLabel(TYPE_H3, '0', 350, 24, 'magnetCounterLabel'), g);
  appendElementTo(shieldPickup, g);
  setElementPosition(shieldPickup, 1500, 32);
  appendElementTo(newTextLabel(TYPE_H3, '0', 1600, 24, 'shieldCounterLabel'), g);
  
  // 
  // Create game over menu.
  // 

  appendElementTo(newTextLabel(TYPE_H2, 'GAME OVER', 0, 220, 'gameOverTitle'), j);
  centerElement(gameOverTitle);
  appendElementTo(newTextLabel(TYPE_H3, '', 0, 470, 'gameTimeLabel'), j);
  centerElement(gameTimeLabel);
  appendElementTo(newTextLabel(TYPE_H3, '', 0, 620, 'finalScoreLabel'), j);
  centerElement(finalScoreLabel);
  appendElementTo(newTextButton(610, 810, 700, 160, 'Continue', '8c2', gameOverButtonClicked), j);

  // 
  // All menus have now been created.
  // 

  b.style.display = 'block';
  onresize(); // Perform initial resize.

  // Open the main menu.
  activeMenu = v;
  v.classList.toggle('menu-visible');

  gameMode = GAME_MODE_MENUS;

  // Start the main game loop.
  lastFrame = Date.now();
  onEnterFrame();
};

const updateBestScoreLabel = e => setHTML(topScoreLabel, OPTIONS.best.toLocaleString());

// Window onload event handler (fired when page fully loaded). Initialize everything and start gameloop.
onload = e => {

  (!(OPTIONS = localStorage.getItem(NAMESPACE))) ? resetOptions() : OPTIONS = JSON.parse(OPTIONS); // Load options , creating new options if not found.
    
  //Reposition and resize the radial gradient that appears behind the sun.
  setElementPosition(s, 640, -824);
  setElementSize(s, 2048, 2048);

  gl2_setup(c); // Initialize webGL renderer.

  // #region - generate assets.

  // 
  // Generate sounds.
  // 

  newSound(...[.5,0,370,.01,.01,.04,2,.6,,,-116,.13,,.2,6,,,.56,.03,.04,801]); // FX_CLICK
  newSound(...[,0,459,.02,.03,.15,1,1.9,,,113,.07,,,,,,.88,.05]); // FX_COIN
  newSound(...[.7,0,484,.01,.04,.39,,4.8,,-59,100,-0.01,.04,-0.2,28,,.02,.81,.06,,1]); // FX_DEFLECT
  newSound(...[1.4,0,669,.04,.27,.15,1,3,,137,,,.06,.1,,,.05,.8,.26]); // FX_SHIELD
  newSound(...[,0,192,.08,.23,.29,1,.2,6,,,,.08,,15,,,.55,.15]); // FX_MAGNET
  newSound(...[1.7,0,263,.01,.14,.19,3,3,13,-1,,,,,,,.28,.71,.14]); // FX_BESTSCORE

  // 
  // Generate the imagery.
  // 

  // Background cloud.
  svgString = SVG_HEAD(800, 600);
  for (let i = 0; i < cloudPointData.length; i+=3) svgString += SVG_CIRCLE(cloudPointData[i], cloudPointData[i + 1], cloudPointData[i + 2]);
  newTextureRegion('cloud', 0, 0);

  // Sun.
  svgString = SVG_HEAD(600, 580) +
  SVG_RECT(1, -234, 798, 814, 'ffc', 407) +
  SVG_RECT(71, -103, 678, 638, 'fe8', 318);
  newTextureRegion('sun', 0, 600);
  
  // Enemy.
  svgString = SVG_HEAD(144, 144) +
  SVG_PATH('m30 62c.3 7 7 9 12 12 6 8 18-3 15-16-2-6-13-6-11-14 .3-6 11-8 9-.3-2 16 29 19 23-6 3-4 11-7 13-.5 8 9-14 21-7 31 7 9 25-6 27-9 7-4 8-11 6-18 2-8-7-11-9-17 2-8-6-14-13-14-7 2-14-6-20 1-6 2-11 6-17 6-6-1-13 2-18-4-9-4-10 7-14 12-5 5-6 12-1 17-4 5-5 15 3 19zm-6 31c1 5 7 9 5 15 2 4 13 2 9 9-.3 6 9 7 7 14 3 9 13 5 19 3 6-2 6-9 .8-12-3-4-.5-8 4-7 6-2 14-5 18 1 3 2 8 .9 6 6 .6 6 8 11 14 9 7-.9 11-10 6-15 5-3 3-10 1-14-4-6 5-12 1-19-5-3-10-9-17-8-9 1-3 11-5 15-7 4-12-6-19-5-6 3-12-2-17 1-6 4-10-2-16-.8-5-.1-18 .5-18 8z', 'fff', 8, '0006');
  newTextureRegion('enemy', 800, 0);

  // Badluck butter chicken.
  svgString = SVG_HEAD(192, 192) +
  SVG_RECT(2, 2, 188, 188, 'fff', 24, 24, 4, '000') +
  SVG_PATH('m96 126c-38 0-68 16-92 42 1 12 10 20 22 20h140c12 0 20-8 22-20-24-26-54-42-92-42z', 'f92') +
  SVG_PATH('m52 4a48 64 0 0042 32 48 64 0 0042-32z', 'b22') +
  SVG_RECT(52, 76, 16, 16, '000', 8) +
  SVG_RECT(124, 76, 16, 16, '000', 8);
  newTextureRegion('chicky', 640, 600, .5);

  svgString = SVG_HEAD(113, 96) +
  SVG_RECT(8, 0, 96, 96, 'ff2', 48) + 
  SVG_RECT(24, 16, 64, 64, 'fd0', 32);
  newTextureRegion('coin0', 800, 250);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m56 0h-22s-34 8-34 48c.0103 40 33.9 48 33.9 48h22.1', 'ff7') + 
  SVG_RECT(15, 0, 81, 96, 'ff2', 41, 48) + 
  SVG_RECT(29, 16, 54, 64, 'fd0', 27, 32);
  newTextureRegion('coin1', 800, 350);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m56 0h-22s-30 8-30 48c.0103 40 29.9 48 29.9 48h22.1', 'ff7') + 
  SVG_RECT(23, 0, 66, 96, 'ff2', 33, 48) + 
  SVG_RECT(34, 16, 44, 64, 'fd0', 22, 32);
  newTextureRegion('coin2', 800, 450);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m57 0h-25s-22 8-22 48c.0103 40 21.9 48 21.9 48h25.1', 'ff7') + 
  SVG_RECT(32, 0, 50, 96, 'ff2', 25, 48) + 
  SVG_RECT(41, 16, 32, 64, 'fd0', 16, 32);
  newTextureRegion('coin3', 800, 550);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m55.5 0h-27.5s-10 8-10 48c.0103 40 9.89 48 9.89 48h27.6', 'ff7') + 
  SVG_RECT(42, 0, 27, 96, 'ff2', 14, 48) + 
  SVG_RECT(47, 16, 18, 64, 'fd0', 9, 32);
  newTextureRegion('coin4', 800, 650);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m41 0s-4.01 8-4 48c.0103 40 4 48 4 48h28s3.99-8 4-48-4-48-4-48z', 'ff7');
  newTextureRegion('coin5', 800, 750);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m54.2 96h27.5s10-8 10-48c-.0103-40-9.89-48-9.89-48h-27.6', 'ff7') + 
  SVG_RECT(41, 0, 27, 96, 'ff2', 13.5, 48) + 
  SVG_RECT(46, 16, 18, 64, 'fd0', 9, 32);
  newTextureRegion('coin6', 800, 850);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m55.5 96h25s22-8 22-48c-.0103-40-21.9-48-21.9-48h-25.1', 'ff7') + 
  SVG_RECT(31, 0, 49.4, 96, 'ff2', 24.7, 48) + 
  SVG_RECT(40, 16, 32, 64, 'fd0', 16, 32);
  newTextureRegion('coin7', 800, 950);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m57 96h22s30-8 30-48c-.0103-40-29.9-48-29.9-48h-22.1', 'ff7') + 
  SVG_RECT(24, 0, 66, 96, 'ff2', 33, 48) + 
  SVG_RECT(35, 16, 44, 64, 'fd0', 22, 32);
  newTextureRegion('coin8', 800, 1050);
  
  svgString = SVG_HEAD(113, 96) +
  SVG_PATH('m57 96h22s34-8 34-48c-.0103-40-33.9-48-33.9-48h-22.1', 'ff7') + 
  SVG_RECT(16, 0, 81, 96, 'ff2', 41, 48) + 
  SVG_RECT(30, 16, 54, 64, 'fd0', 27, 32);
  newTextureRegion('coin9', 800, 1150);

  // Star.
  svgString = SVG_HEAD(96, 96) +
  SVG_PATH('m76 96-28-16-31 14 6-33-22-27 32-4 17-31 14 30 33 8-23 23z', 'ff2');
  newTextureRegion('star', 914, 150);

  // Magnet pickup.
  svgString = SVG_HEAD(96, 96) +
  SVG_PATH('m48 0c-27-5e-15-48 21-48 48v48h32v-48c0-9 7-16 16-16s16 7 16 16v48h32v-48c0-27-21-48-48-48z', 'f34') + 
  SVG_RECT(0, 68, 32, 38, 'eee') + 
  SVG_RECT(64, 68, 32, 28, 'eee');
  newTextureRegion('magnetPickup', 914, 250);

  // Shield pickup.
  svgString = SVG_HEAD(96, 96) +
  SVG_PATH('m96 48-12-48-58 8-26 40 26 40 58 8z', 'f8f') + 
  SVG_PATH('m88 48-10-40-48 6-22 34 22 34 48 6z', 'f1f');
  newTextureRegion('shieldPickup', 914, 350);

  // Magnetic wave.
  svgString = SVG_HEAD(160, 48) +
  SVG_PATH('m0 0h120l-35 30 75 18h-130c-3 0 45-30 45-30z', '8f8', 8, '0f0c');
  newTextureRegion('wave', 600, 800);

  // Shield.
  svgString = SVG_HEAD(168, 168) +
  `<defs>` + 
  SVG_RADIALGRADIENT(84, 84, 84, '8df', 0, .9, '8df', 1, 1) + 
  SVG_RADIALGRADIENT(112, 54, 24, 'eff', 1, 0, 'eff', 0, 1) + 
  `</defs>` + 
  SVG_RECT(0, 0, 168, 168, `Z${SVG_ID - 1}`, 84) + 
  SVG_RECT(88, 30, 48, 48, `Z${SVG_ID}`, 24);
  newTextureRegion('shield', 600, 850);

  // Call with no arguments means that all assets have been generated.
  svgString = SVG_HEAD(0, 0);
  newTextureRegion();

  // #endregion

  // #region - Install other DOM event handlers

  // Spawn some random star particles when the pointer is clicked.
  onpointerup = e => spawnStarShower({x: e.clientX, y: e.clientY}, 20);

  // Show the mouse cursor when the mouse is moved.
  onpointermove = e => showCursor(1);

  // Pause when page loses focus.
  onblur = e =>{
    pauseState = paused;
    paused = 1;
    if (OPTIONS.audio) enableAudio(0);
  }

  // Unpause when page gains focus.
  onfocus = e => {
    paused = pauseState;
    enableAudio(OPTIONS.audio);
    lastFrame = Date.now();
  };
  
  // Key down event handler.
  onkeydown = e => {
    // if (e.code != 'F5' || e.code != 'F11' || e.code != 'F2') e.preventDefault(); // We don't want to break the F5 key.

    if (keysEnabled && !waitingForKey) {
      const keyCode = e.code;
      if (!leftHeld && keyCode === OPTIONS.controls[CONTROL_LEFT].code) {
        leftHeld = 1;
        rightHeld = 0;
      };
      if (!rightHeld && keyCode === OPTIONS.controls[CONTROL_RIGHT].code) {
        rightHeld = 1;
        leftHeld = 0;
      };
    }
  };

  // Key up event handler
  onkeyup = e => {
    // log(e);

    let keyCode = e.code;

    if (waitingForKey) {
      // Process keyup events when the game is waiting for a new controll key to be pressed
      setButtonLabel(controlLabel, e.code);
      OPTIONS.controls[controlIndex].code = e.code;
      waitingForKey = 0; // No longer waiting for this event.
      saveOptions();

    } else if (keysEnabled) {
      // Process keyup events when the game is running.
      if (leftHeld && keyCode === OPTIONS.controls[CONTROL_LEFT].code) leftHeld = 0;
      if (rightHeld && keyCode === OPTIONS.controls[CONTROL_RIGHT].code) rightHeld = 0;
    }

    if (keyCode === 'Enter' || keyCode === 'Space') {
      switch (gameMode) {
        case GAME_MODE_MENUS:
          if (activeMenu === m) playButtonClicked();
          else if (activeMenu === v) pregameButtonClicked();
          break;

        case GAME_MODE_GAMEOVER:
          gameOverButtonClicked();
          break;
      
        default:
          break;
      }
    }
  };

  // Window resize event handler. Scale and center game scene container.
  onresize = e => {
    b.style.transform = `scale(${min(innerWidth / WIDTH, innerHeight / HEIGHT)})`; // Scale container.
    b.style.left = (~~(innerWidth - b.getBoundingClientRect().width) / 2) + px; // Center on x-axis.
  }

  // #endregion

  particles = [];

};

// // Update particles.
const updateParticles = () => {
  // Process particles here so they appear on top of everything else
 
  if (particles.length) { // Check to be sure there is at least one partlcle

    for (let i = particles.length; i--;) {
    // for (let i = particles.length - 1; i >= 0; i--) {
      const actor = particles[i];

      if ((actor.counter -= DT) <= 0) { // Particle has expired.

        particles.splice(i, 1); // If the ttl reaches 0 or below, remove the particle from the list

      } else {

        actor.vx += actor.gx; // Apply gravity.
        actor.vy += actor.gy;

        actor.x += actor.vx * DT; // Update position.
        actor.y += actor.vy * DT;

        actor.angle += actor.rotationRate;
        let ratio = 1 / actor.ttl * actor.counter; // Scaling ratio.
        if (actor.fades) actor.alpha = actor.originalAlpha * ratio; // Scale alpha.
        if (actor.shrinks) {
          actor.scale = actor.originalScale * ratio; // Scale size.
          actor.iX = ((actor.texture.w * actor.originalScale) * (1 - ratio)) / 2;
          actor.iY = ((actor.texture.h * actor.originalScale) * (1 - ratio)) / 2;
        }

        renderList.push(actor);
      }
    }
  }
};

// Spawn a new coin.
const spawnCoin = (x, y, v, texture, type, frame) => {
  const coin = coinPool.pop();
  activeCoins.add(coin);
  coin.texture = getTextureRegion(texture);
  coin.x = x;
  coin.y = y;
  coin.vy = v;
  coin.vx = 0;
  coin.type = type;
  coin.frame = frame;
};

// Spawn the given number of particles with the given image at the given actors position.
const spawnRadialShower = (x, y, image) => {
  for (let k = 4; k--;) {
    newParticle(
      1, // ttl
      x, // x
      y, // y
      random() * PI2, // angle
      image, // texture
      600 + randomInt(50, 250), // speed
      1, // fades
      1, // alpha
      1, // shrinks
      1 + random() * .25, // scale
      0, // rotationRate
      0, // gx
      15 + randomInt(10, 20) // gy
    );
  }
};

// Initialize the game over game state.
const gameOver = e => {
  gameMode = GAME_MODE_GAMEOVER;

  stopMusic(gameMusicObject);
  playMusic(gameOverMusicObject);

  magnetized = shielded = collisionsEnabled = 0;

  activeCoins.forEach((coin) => {
    let image;
    coin.vx = coin.vy = 0;
    switch (coin.type) {
      case ACTOR_TYPE_SHIELD_PICKUP:
        image = 'shieldPickup';
        break;
    
      case ACTOR_TYPE_MAGNET_PICKUP:
        image = 'magnetPickup';
        break;
    
      default:
        image = 'coin0';
        break;
    }
    spawnRadialShower(coin.x, coin.y, image);
  });

  enemies.forEach((enemy) => {
    enemy.vx = enemy.vy = enemy.rotationRate = 0;
    spawnRadialShower(enemy.x, enemy.y, 'enemy');
  });

  enemies = [];
  activeCoins = new Set();

  leftHeld = rightHeld = keysEnabled = 0;

  player.vy = -3000;
  player.gy = 123;

  setHTML(gameTimeLabel, `Your luck ran out after ${elapsedTime | 0} seconds`);
  setHTML(finalScoreLabel, `You scored ${playerScore.toLocaleString()} points (${['Abysmal', 'Dismal', 'Pathetic', 'Terrible', 'Poor', 'Mediocre', 'Fair', 'Modest', 'Adequate', 'Good', 'Solid', 'Excellent', 'Superb', 'Fantastic', 'Stupendous'][min((playerScore / 1e4) | 0, 14)]})`);

  j.classList.toggle('menu-visible');
  showCursor(1);
};

// Close the game over menu, open the main menu, and play the menu music.
const gameOverButtonClicked = e => {
  stopMusic(gameOverMusicObject);
  playMusic(menuMusicObject);

  if (gotBestScore) {
    OPTIONS.best = playerScore;
    updateBestScoreLabel();
    saveOptions();
  }

  j.classList.toggle('menu-visible');
  
  openMenu(m);
  gameMode = GAME_MODE_MENUS;
};

// Main game loop.
onEnterFrame = (t) => {
  requestAnimationFrame(onEnterFrame);

  if (paused) return

  // Update game timing.
  thisFrame = Date.now();
  DT = (thisFrame - lastFrame) / 1000;
  lastFrame = thisFrame;
  elapsedTime += DT;

  renderList = [];

  if (gameMode === GAME_MODE_PLAYING) {

    // 
    // Player is inside game
    // 
    
    let pointsToAward = 0;

    const coinsToDelete = [];

    // Spawn a magnet pickup when the countdown expires.
    if ((magnetPickupSpawnTimer -= DT) < 0) {
      magnetPickupSpawnTimer += (10 + random() * 3);
      spawnCoin(randomXPosition(), -100, 300, 'magnetPickup', ACTOR_TYPE_MAGNET_PICKUP);
    }

    // Spawn a shield pickup when the countdown expires.
    if ((shieldPickupSpawnTimer -= DT) < 0) {
      shieldPickupSpawnTimer += (10 + random() * 3);
      spawnCoin(randomXPosition(), -100, 300, 'shieldPickup', ACTOR_TYPE_SHIELD_PICKUP);
    }

    // remove magnetized effect when timer expires.
    if (magnetized) {

      if ((magnetEffectSpawnTimer -= DT) < 0) {
        magnetEffectSpawnTimer += .05;

        newParticle(
          1.25, // ttl
          player.x, // x
          player.y, // y
          PI2 / 2 + random() * M.PI,
          'wave', // texture
          400 + randomInt(50, 250), // speed
          1, // fades
          1, // alpha
          1, // shrinks
          .5 + random() * .5, // scale
          0, // rotationRate
          0, // gx
          0 // gy
        );
      }  

      if ((magnetCounter -= DT) < 0) {
        magnetCounter = 0;
        magnetized = 0;
      }
      setHTML(magnetCounterLabel, magnetCounter | 0);
    }

    // remove shielded effect when timer expires.
    if (shielded) {
      if ((shieldCounter -= DT) < 0) {
        shieldCounter = 0;
        shielded = 0;
      }
      setHTML(shieldCounterLabel, shieldCounter | 0);
    }
    
    // Spawn effects if player got a new best score.
    if (spawningBestScoreEffects) {
      if ((bestScoreEffectsSpawnTimer -= DT) <= 0) {
        bestScoreEffectsSpawnTimer = .1;
        spawnStarShower({ x: randomInt(0, WIDTH), y: randomInt(0, HEIGHT) }, 30);
        if ((bestScoreEffectsSpawnCounter -= 1) < 0) spawningBestScoreEffects = 0;
      }
    }

    if ((coinSpawnTimer -= DT) <= 0) {
      coinSpawnTimer = random() * 2;
      spawnCoin(randomXPosition(), -100, 250, 'coin0', ACTOR_TYPE_COIN, randomInt(0, 9));
    }
    
    if ((coinTrailTimer -= DT) <= 0) {
      coinTrailTimer = randomInt(1, 3);
      let x = (randomInt(0, 12) * 144);
      let y = -500;
      let v = randomInt(220, 270);
      // let v = randomInt(420, 470);
      let frame = randomInt(0, 9);
      for (let i = 5; i--;) {
        spawnCoin(x, (y += 100), v, 'coin0', ACTOR_TYPE_COIN, frame);
        frame = (frame + 2) % 10;
      }
    }

    MULTIPLIER = clamp(MULTIPLIER + 0.003, 0, 2.5); // Scale base speed of mongols and their projectiles.

// #region Process player.
    let vx = player.vx;
    let rotation = player.angle;

    if (leftHeld) { // Player accelerating left, transitioning to leaning left.

      vx -= (vx > 0) ? playerAcceleration * 8 : playerAcceleration;
      rotation -= playerLeanFactor;

    } else if (rightHeld) { // Player accelerating right, transitioning to leaning right.

      vx += (vx < 0) ? playerAcceleration * 8 : playerAcceleration;
      rotation += playerLeanFactor;

    } else { // Player decelerating, transitioning to not leaning.

      if (vx > 0) {
        vx = clamp(vx - playerAcceleration, 0, playerMaxVelocity);
        rotation = clamp(rotation - playerLeanFactor * 2, 0, playerLeanFactor * 4);

      } else {

        vx = clamp(vx + playerAcceleration * 2, -playerMaxVelocity * 2, 0);
        rotation  = clamp(rotation + playerLeanFactor * 2, -playerLeanFactor * 4, 0);
      }
    }

    // Update velocity and rotation.
    player.vx = clamp(vx, -playerMaxVelocity, playerMaxVelocity);
    player.angle = clamp(rotation, -playerLeanFactor * 4, playerLeanFactor * 4);

    player.x = clamp(player.x + (player.vx * DT), 48, WIDTH - 48); // Move player.

    // Add velocity on y axis. This only occurs when the game has ended.
    player.vy += player.gy;
    player.y += player.vy * DT;
    if (player.y > HEIGHT + 96) player.vy = player.gy = 0;

    renderList.push(player);
    if (shielded) {
      shieldOverlay.x = player.x;
      renderList.push(shieldOverlay);
    }
// #endregion

// #region Process coins.
  activeCoins.forEach((coin) => {

    let currentFrame = ((elapsedTime % duration / duration) * frames) | 0;

    coin.y += coin.vy * DT * MULTIPLIER;
    coin.x += coin.vx * DT * MULTIPLIER;

    renderList.push(coin);

    if (coin.y > HEIGHT + 100) coinsToDelete.push(coin);

    const dx = coin.x - player.x;
    const dy = coin.y - player.y;
    const distance = M.sqrt(dx * dx + dy * dy);

    if (coin.type === ACTOR_TYPE_COIN) {
      
      coin.texture = getTextureRegion(`coin${(currentFrame + coin.frame) % frames}`);
    }

    if (magnetized && coin.type === ACTOR_TYPE_COIN) {

      const attractionRadius = 550;
      const attractionForce = 200;
      if (distance < attractionRadius) {
        const force = attractionForce * (1 - distance / attractionRadius);
        const directionX = dx / distance;
        // const directionY = dy / distance;

        coin.vx += force * -directionX;
        // coin.vy += force * directionY;
      }
    }

    if ((distance <= coin.radius + player.radius) && collisionsEnabled) {
      coinsToDelete.push(coin);
      switch (coin.type) {
        case ACTOR_TYPE_COIN:
          pointsToAward += 150;
          playSound(FX_COIN);
          spawnCoinShower(coin, 5);
          break;

        case ACTOR_TYPE_MAGNET_PICKUP:
          magnetized = 1;
          magnetCounter += 8;
          magnetEffectSpawnTimer = 0;
          playSound(FX_MAGNET);
          break;
      
        case ACTOR_TYPE_SHIELD_PICKUP:
          shielded = 1;
          shieldCounter += 8;
          playSound(FX_SHIELD);
          break;
      
        default:
          break;
      }

    }

  });

  // Recycle coins that went past the bottom of the screen.
  coinsToDelete.forEach((coin) => {
    activeCoins.delete(coin);
    coinPool.push(coin);
  });

// #endregion

// #region Process enemies.

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];

      if (enemy.y > -144) {

        if (enemy.collides && collisionsEnabled) { // Only check collision if the enemy allows for it. Enemies who have been deflected do not collide.

          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const distance = M.sqrt(dx * dx + dy * dy);

          const deflectEnemy = () => {
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = enemy.radius + player.radius - distance;
            const dotProduct = enemy.vx * nx + enemy.vy * ny;
          
            enemy.x += nx * overlap / 2;
            enemy.y += ny * overlap / 2;
          
            enemy.vx -= 4 * dotProduct * nx;
            enemy.vy -= 4 * dotProduct * ny;
            
            enemy.collides = 0;

            for (let k = 10; k--;) {
              newParticle(
                1, // ttl
                player.x, // x
                player.y, // y
                PI2 / 2 + random() * M.PI,
                'shieldPickup', // texture
                450 + randomInt(50, 200), // speed
                1, // fades
                1, // alpha
                1, // shrinks
                .4 + random() * .35, // scale
                0, // rotationRate
                0, // gx
                0 // gy
              );
            }

            playSound(FX_DEFLECT);
          };

          if (distance <= enemy.radius + player.radius) { // there was a collision, resolve it.

            // Between the following angles the player can deflect the enemy and be rewarded.
            const angleInDegrees = (enemy.angle * (180 / M.PI)) % 360;
            if (angleInDegrees > 70 && angleInDegrees < 130) {

              pointsToAward += 2000;
              spawnStarShower(enemy, 30);
              deflectEnemy();

            } else {

              // For all other anlges the player deflects the enemy if they are shielded, or dies.

              if (shieldCounter > 0 ) { // Player is shielded so bounce the enemy off and award points.

                deflectEnemy();
  
                pointsToAward += 250;
  
              } else {
 
                gameOver();
  
              }
            }

          }

        } else { // Constrain enemy velocity.

          enemy.vy = clamp(enemy.vy += 20, -900, 2000);
        }
      }

      // Update enemy position after collision check.
      enemy.y += enemy.vy * MULTIPLIER * DT;
      enemy.x += enemy.vx * MULTIPLIER * DT;

      enemy.angle += enemy.rotationRate;

      // Wrap enemy position if it goes off the screen.
      if (enemy.y > HEIGHT + 72) {
        enemy.y = randomYPosition();
        enemy.vy = randomFallSpeed();
        enemy.vx = 0;
        enemy.x = (enemy.lane * 144) + 72;
        enemy.collides = 1;
        enemy.angle = random() * PI2;
        enemy.rotationRate = -PI2 * .005 + (random() * (PI2 * .010));
      }

      renderList.push(enemy);
    }
// #endregion

    if (pointsToAward) awardPoints(pointsToAward); // Award any accrued points.

  } // END game playing 

// #region Process parallax clouds.

  const cloudRegion = getTextureRegion('cloud');

  for (let i = clouds.length; i--;) {

    const 
    cloud = clouds[i],
    w = cloudRegion.w * cloud.scale,
    h = cloudRegion.h * cloud.scale;
    
    let y = cloud.y + cloud.vy * DT;

    if (y > HEIGHT + h) {
      cloud.x = randomInt(-(w / 2), WIDTH);
      y = randomInt(-h, -h + 50);
      cloud.x = randomInt(0, WIDTH);
    }
    cloud.y = y;

    renderList.push(cloud);
  }
  // #endregion

// #region Render game scene.

  renderList.sort((a, b) => (a.type < b.type) ? 1 : -1); // Sort into descending type order.

  updateParticles(); // Particles appear on top of everything else, so they don't need to be added to `renderList` before sorting.
    
  const normal = 0xFFFFFF00;

  for (let i = renderList.length; i--;) {

    const actor = renderList[i];
    const r = actor.texture;

    gl2_drawImage(r.x, r.y, r.w, r.h, actor.x - r.w / 2, actor.y - r.h / 2, r.w * actor.scale, r.h * actor.scale, normal + actor.alpha * 127, actor.angle);

  }

  gl2_drawEverything();

// #endregion

  // Finally stop any music that needs to be stopped.
  for (let i = musicToStop.length; i--;) {
    const musicObject = musicToStop[i];
    if ((musicObject.timer -= DT) < 0) {
      musicObject.buffer.stop();
      musicToStop.pop();
    }
  }

};

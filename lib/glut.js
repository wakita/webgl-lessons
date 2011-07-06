
var module = {};

(function () {
    var Self = {
      extend: function (spec) {
        for (var id in spec) { this[id] = spec[id]; }
        return this;
      },

      clone: function (spec) {
        return { __proto__: this }.extend(spec);
      },

      equals: function (o) {
        return this === o;
      },

      toString: function () {
        return JSON.stringify(this, null, 2);
      },

      toJSON: function () { return this; },

      superior: function (id) {
        var self = this;
        var method = self.__proto__[id];
        return function () {
          return method.apply(self, arguments);
        }
      },
    };

    Self.brainwash = function (o, spec) {
      o.extend = Self.extend;
      return Self.extend.apply(o, [spec]);
    };

    module.Self = Self;

    module.Exception= {
      message: 'Exception',
      toString: function () { return this.message; }
    };

    var Array = [];
    Self.extend.apply(Array, [Self]);
    Array.clone = function (spec) {
      var array = [];
      array.__proto__ = this;
      return array.extend(spec);
    };
    Array.toJSON = function () {
      return this.map(function (v, _1, _2) {
          return v.toJSON();
        });
    };
    module.Array = Array;
  })();

var Self = module.Self;

// vim: shiftwidth=2
var load_text_from_url = function (url) {
  var req = new XMLHttpRequest();
  req.open('GET', url, false);
  req.overrideMimeType('text/plain');
  req.send(null);
  return req.status === 200 ? req.responseText : null;
};

var gl, GL;
var initGL = function (canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
  } catch (e) {}
  if (!gl) {
    alert("Could not initialize WebGL, sorry");
    return null;
  }

  GL = Self.clone({ viewport: { w: canvas.width, h: canvas.height } });
  gl.viewport(0, 0, GL.viewport.w, GL.viewport.h);

  // Shaders

  GL.shader = function () {
    var program = Self.brainwash(gl.createProgram(), { a: {}, u: {} });

    return program.extend({
        attach: function (url, type) {
          var script = load_text_from_url(url), shader = gl.createShader(type);
          if (script === null || typeof shader === 'undefined') return null;

          gl.shaderSource(shader, script);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log('Failed to compile', url, type);
            return;
          }
          gl.attachShader(this, shader);
        },

        attribute: function (name) {
          var attr = this.a[name] = gl.getAttribLocation(this, name);
          gl.enableVertexAttribArray(attr);
        },

        uniform: function (name) {
          var u = gl.getUniformLocation(this, name);
          this[name] = { u: u };
        },

        link: function () {
          gl.linkProgram(this);
          if (!gl.getProgramParameter(this, gl.LINK_STATUS))
            alert("Could not initialize shader");
          // gl.validateProgram(this);
          return;
        },

        use: function () { gl.useProgram(this); }
      });
  };

  // Buffers

  var new_buffer = function (dim, data) {
    var length = data.length;
    if (length % dim !== 0) return null;
    
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buf.itemSize = dim;
    buf.numItems = length / dim;

    return buf;
  };

  GL.shape_buffer = function (dim, shape, data) {
    var buf = new_buffer(dim, data);
    if (buf === null) return null;

    buf.set_shape = function (pos) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(pos, dim, gl.FLOAT, false, 0, 0);
    };

    buf.draw = function () {
      gl.drawArrays(shape, 0, this.numItems);
    };

    return buf;
  };

  GL.color_buffer = function (dim, data) {
    var buf = new_buffer(dim, data);
    if (buf === null) return null;

    buf.set_color = function (color) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(color, dim, gl.FLOAT, false, 0, 0);
    };
    return buf;
  };
};

var matrix = {};

// Model-View matrix
function loadIdentity() { mat4.identity(matrix.MV); }
function multMatrix(m) { matrix.MV = matrix.MV.x(m); }

var mvTranslate = function (v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

var mvRotate = function (rad, v) {
  multMatrix(Matrix.Rotation(rad, $V([v[0], v[1], v[2]])).ensure4x4());
};

matrix.MVstack = [];
var mvPushMatrix = function (m) {
  if (m) {
    matrix.MVstack.push(m.dup());
    matrix.MV = m.dup();
  } else {
    matrix.MVstack.push(matrix.MV.dup());
  }
};

var mvPopMatrix = function () {
  if (matrix.MVstack.length === 0)
    throw 'popMatrix applied to an empty stack';
  matrix.MV = matrix.MVstack.pop();
  return matrix.MV;
};

// Perspective matrix

function perspective(fovy, aspect, znear, zfar) {
  mat4.perspective(fovy, aspect, znear, zfar, matrix.P);
}

// vim: sw=2

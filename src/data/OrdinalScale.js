/**
 * Returns an ordinal scale for the specified domain. The arguments to this
 * constructor are optional, and equivalent to calling {@link #domain}.
 *
 * @class Represents an ordinal scale. <style
 * type="text/css">sub{line-height:0}</style> An ordinal scale represents a
 * pairwise mapping from <i>n</i> discrete values in the input domain to
 * <i>n</i> discrete values in the output range. For example, an ordinal scale
 * might map a domain of species ["setosa", "versicolor", "virginica"] to colors
 * ["red", "green", "blue"]. Thus, saying
 *
 * <pre>    .fillStyle(function(d) {
 *         switch (d.species) {
 *           case "setosa": return "red";
 *           case "versicolor": return "green";
 *           case "virginica": return "blue";
 *         }
 *       })</pre>
 *
 * is equivalent to
 *
 * <pre>    .fillStyle(pv.Scale.ordinal("setosa", "versicolor", "virginica")
 *         .range("red", "green", "blue")
 *         .by(function(d) d.species))</pre>
 *
 * If the mapping from species to color does not need to be specified
 * explicitly, the domain can be omitted. In this case it will be inferred
 * lazily from the data:
 *
 * <pre>    .fillStyle(pv.colors("red", "green", "blue")
 *         .by(function(d) d.species))</pre>
 *
 * When the domain is inferred, the first time the scale is invoked, the first
 * element from the range will be returned. Subsequent calls with unique values
 * will return subsequent elements from the range. If the inferred domain grows
 * larger than the range, range values will be reused. However, it is strongly
 * recommended that the domain and the range contain the same number of
 * elements.
 *
 * <p>A range can be discretized from a continuous interval (e.g., for pixel
 * positioning) by using {@link #split}, {@link #splitFlush} or
 * {@link #splitBanded} after the domain has been set. For example, if
 * <tt>states</tt> is an array of the fifty U.S. state names, the state name can
 * be encoded in the left position:
 *
 * <pre>    .left(pv.Scale.ordinal(states)
 *         .split(0, 640)
 *         .by(function(d) d.state))</pre>
 *
 * <p>N.B.: ordinal scales are not invertible (at least not yet), since the
 * domain and range and discontinuous. A workaround is to use a linear scale.
 *
 * @param {...} domain... optional domain values.
 * @extends pv.Scale
 * @see pv.colors
 */
pv.Scale.ordinal = function() {
  var d = [], i = {}, r = [], band = 0;

  /** @private */
  function scale(x) {
    if (!(x in i)) i[x] = d.push(x) - 1;
    return r[i[x] % r.length];
  }

  /**
   * Sets or gets the input domain. This method can be invoked several ways:
   *
   * <p>1. <tt>domain(values...)</tt>
   *
   * <p>Specifying the domain as a series of values is the most explicit and
   * recommended approach. However, if the domain values are derived from data,
   * you may find the second method more appropriate.
   *
   * <p>2. <tt>domain(array, f)</tt>
   *
   * <p>Rather than enumerating the domain values as explicit arguments to this
   * method, you can specify a single argument of an array. In addition, you can
   * specify an optional accessor function to extract the domain values from the
   * array.
   *
   * <p>3. <tt>domain()</tt>
   *
   * <p>Invoking the <tt>domain</tt> method with no arguments returns the
   * current domain as an array.
   *
   * @function
   * @name pv.Scale.ordinal.prototype.domain
   * @param {...} domain... domain values.
   * @returns {pv.Scale.ordinal} <tt>this</tt>, or the current domain.
   */
  scale.domain = function(array, f) {
    if (arguments.length) {
      array = (array instanceof Array)
          ? ((arguments.length > 1) ? pv.map(array, f) : array)
          : Array.prototype.slice.call(arguments);

      /* Filter the specified ordinals to their unique values. */
      d = [];
      var seen = {};
      for (var j = 0; j < array.length; j++) {
        var o = array[j];
        if (!(o in seen)) {
          seen[o] = true;
          d.push(o);
        }
      }

      i = pv.numerate(d);
      return this;
    }
    return d;
  };

  /**
   * Sets or gets the output range. This method can be invoked several ways:
   *
   * <p>1. <tt>range(values...)</tt>
   *
   * <p>Specifying the range as a series of values is the most explicit and
   * recommended approach. However, if the range values are derived from data,
   * you may find the second method more appropriate.
   *
   * <p>2. <tt>range(array, f)</tt>
   *
   * <p>Rather than enumerating the range values as explicit arguments to this
   * method, you can specify a single argument of an array. In addition, you can
   * specify an optional accessor function to extract the range values from the
   * array.
   *
   * <p>3. <tt>range()</tt>
   *
   * <p>Invoking the <tt>range</tt> method with no arguments returns the
   * current range as an array.
   *
   * @function
   * @name pv.Scale.ordinal.prototype.range
   * @param {...} range... range values.
   * @returns {pv.Scale.ordinal} <tt>this</tt>, or the current range.
   */
  scale.range = function(array, f) {
    if (arguments.length) {
      r = (array instanceof Array)
          ? ((arguments.length > 1) ? pv.map(array, f) : array)
          : Array.prototype.slice.call(arguments);
      if (typeof r[0] == "string") r = r.map(pv.fillStyle);
      r.min = r[0];
      r.max = r[r.length - 1];
      return this;
    }
    return r;
  };

  /**
   * Sets the range from the given continuous interval. The interval
   * [<i>min</i>, <i>max</i>] is subdivided into <i>n</i> equispaced points,
   * where <i>n</i> is the number of (unique) values in the domain. The first
   * and last point are offset from the edge of the range by half the distance
   * between points.
   *
   * <p>This method must be called <i>after</i> the domain is set.
   * <p>
   * The computed step width can be retrieved from the range as
   * <tt>scale.range().step</tt>.
   * </p>
   *
   * @function
   * @name pv.Scale.ordinal.prototype.split
   * @param {number} min minimum value of the output range.
   * @param {number} max maximum value of the output range.
   * @returns {pv.Scale.ordinal} <tt>this</tt>.
   * @see #splitFlush
   * @see #splitBanded
   */
  scale.split = function(min, max) {
    var R = max - min;
    var N = this.domain().length;
    var step = 0;
    if(R === 0){
        r = pv.array(N, min);
    } else if(N){
        step = (max - min) / N;
        r = pv.range(min + step / 2, max, step);
    }
    r.min = min;
    r.max = max;
    r.step = step;
    return this;
  };

  /**
   * Sets the range from the given continuous interval.
   * The interval [<i>min</i>, <i>max</i>] is subdivided into <i>n</i> equispaced bands,
   * where <i>n</i> is the number of (unique) values in the domain.
   *
   * The first and last band are offset from the edge of the range by
   * half the distance between bands.
   *
   * The positions are centered in each band.
   * <pre>
   * m = M/2
   *
   *  |mBm|mBm| ... |mBm|
   * min               max
   *   r0 -> min + m + B/2
   * </pre>
   * <p>This method must be called <i>after</i> the domain is set.</p>
   * <p>
   * The computed absolute band width can be retrieved from the range as
   * <tt>scale.range().band</tt>.
   * The properties <tt>step</tt> and <tt>margin</tt> are also exposed.
   * </p>
   *
   * @function
   * @name pv.Scale.ordinal.prototype.splitBandedCenter
   * @param {number} min minimum value of the output range.
   * @param {number} max maximum value of the output range.
   * @param {number} [band] the fractional band width in [0, 1]; defaults to 1.
   * @returns {pv.Scale.ordinal} <tt>this</tt>.
   * @see #split
   */
  scale.splitBandedCenter = function(min, max, band) {
    scale.split(min, max);
    if (band == null) {
        band = 1;
    }
    r.band   = r.step * band;
    r.margin = r.step - r.band;
    r.min = min;
    r.max = max;
    return this;
  };

  /**
   * Sets the range from the given continuous interval.
   * The interval [<i>min</i>, <i>max</i>] is subdivided into <i>n</i> equispaced bands,
   * where <i>n</i> is the number of (unique) values in the domain.
   *
   * The first and last bands are aligned to the edges of the range.
   * <pre>
   *  |Bm|mBm| ...|mB|
   *  or
   *  |BM |BM |... |B|
   * min           max
   *   r0 -> min + B/2
   * </pre>
   * <p>
   * The positions are centered in each band
   * (the first position is at <tt>min + band / 2</tt>).
   * </p>
   * <p>This method must be called <i>after</i> the domain is set.</p>
   * <p>
   * The computed absolute band width can be retrieved from the range as
   * <tt>scale.range().band</tt>.
   * The properties <tt>step</tt> and <tt>margin</tt> are also exposed.
   * </p>
   *
   * @function
   * @name pv.Scale.ordinal.prototype.splitBandedFlushCenter
   * @param {number} min minimum value of the output range.
   * @param {number} max maximum value of the output range.
   * @param {number} [band] the fractional band width in [0, 1]; defaults to 1.
   * @returns {pv.Scale.ordinal} <tt>this</tt>.
   * @see #split
   */
  scale.splitBandedFlushCenter = function(min, max, band) {
    if (band == null) {
        band = 1;
    }

    var R = (max - min),
        N = this.domain().length,
        S = 0,
        B = 0,
        M = 0;
    if(R === 0){
        r = pv.array(N, min);
    } else if(N){
        B = (R * band) / N;
        M = N > 1 ? ((R - N * B) / (N - 1)) : 0;
        S = M + B;

        r = pv.range(min + B / 2, max, S);
    }

    r.step   = S;
    r.band   = B;
    r.margin = M;
    r.min = min;
    r.max = max;
    return this;
  };

  /**
   * Sets the range from the given continuous interval. The interval
   * [<i>min</i>, <i>max</i>] is subdivided into <i>n</i> equispaced points,
   * where <i>n</i> is the number of (unique) values in the domain. The first
   * and last point are exactly on the edge of the range.
   *
   * <p>This method must be called <i>after</i> the domain is set.
   *
   * @function
   * @name pv.Scale.ordinal.prototype.splitFlush
   * @param {number} min minimum value of the output range.
   * @param {number} max maximum value of the output range.
   * @returns {pv.Scale.ordinal} <tt>this</tt>.
   * @see #split
   */
  scale.splitFlush = function(min, max) {
    var n = this.domain().length,
        step = (max - min) / (n - 1);

    r = (n == 1) ? [(min + max) / 2]
        : pv.range(min, max + step / 2, step);
    r.min = min;
    r.max = max;
    return this;
  };

  /**
   * Sets the range from the given continuous interval. The interval
   * [<i>min</i>, <i>max</i>] is subdivided into <i>n</i> equispaced bands,
   * where <i>n</i> is the number of (unique) values in the domain. The first
   * and last band are offset from the edge of the range by the distance between
   * bands.
   *
   * <p>The band width argument, <tt>band</tt>, is typically in the range [0, 1]
   * and defaults to 1. This fraction corresponds to the amount of space in the
   * range to allocate to the bands, as opposed to padding. A value of 0.5 means
   * that the band width will be equal to the padding width. The computed
   * absolute band width can be retrieved from the range as
   * <tt>scale.range().band</tt>.
   * The properties <tt>step</tt> and <tt>margin</tt> are also exposed.
   * </p>
   *
   * <pre>
   * m = M/2
   *
   *  |MBm|mBm| ... |mBM|
   * min               max
   *   r0 -> min + M
   * </pre>
   *
   * <p>If the band width argument is negative, this method will allocate bands
   * of a <i>fixed</i> width <tt>-band</tt>, rather than a relative fraction of
   * the available space.
   *
   * <p>Tip: to inset the bands by a fixed amount <tt>p</tt>, specify a minimum
   * value of <tt>min + p</tt> (or simply <tt>p</tt>, if <tt>min</tt> is
   * 0). Then set the mark width to <tt>scale.range().band - p</tt>.
   *
   * <p>This method must be called <i>after</i> the domain is set.
   *
   * @function
   * @name pv.Scale.ordinal.prototype.splitBanded
   * @param {number} min minimum value of the output range.
   * @param {number} max maximum value of the output range.
   * @param {number} [band] the fractional band width in [0, 1]; defaults to 1.
   * @returns {pv.Scale.ordinal} <tt>this</tt>.
   * @see #split
   */
  scale.splitBanded = function(min, max, band) {
    if (arguments.length < 3) band = 1;
    if (band < 0) {
      var n = this.domain().length,
          total = -band * n,
          remaining = max - min - total,
          padding = remaining / (n + 1);
      r = pv.range(min + padding, max, padding - band);
      r.band = -band;
    } else {
      var step = (max - min) / (this.domain().length + (1 - band));
      r = pv.range(min + step * (1 - band), max, step);
      r.band = step * band;
      r.step = step;
      r.margin = step - r.band;
    }
    r.min = min;
    r.max = max;
    return this;
  };

  /**
   * Inverts the specified value in the output range,
   * returning the index of the closest corresponding value in the input domain.
   * This is frequently used to convert the mouse location (see {@link pv.Mark#mouse})
   * to a value in the input domain.
   *
   * The number of input domain values is returned
   * if the specified point is closest to the end margin of the last input domain value.
   *
   * @function
   * @name pv.Scale.quantitative.prototype.invertIndex
   * @param {number} y a value in the output range (a pixel location).
   * @param {boolean} [noRound=false] returns an un-rounded result.
   * @returns {number} the index of the closest input domain value.
   */
  scale.invertIndex = function(y, noRound) {
    var N = this.domain().length;
    if(N === 0){
        return -1;
    }

    var r = this.range();
    var R = r.max - r.min;
    if(R === 0){
        return 0;
    }

    var S = R/N;
    if(y >= r.max){
        return N;
    }

    if(y < r.min){
        return 0;
    }

    var i = (y - r.min) / S;
    return noRound ? i : Math.round(i);
  };

  /**
   * Returns a view of this scale by the specified accessor function <tt>f</tt>.
   * Given a scale <tt>y</tt>, <tt>y.by(function(d) d.foo)</tt> is equivalent to
   * <tt>function(d) y(d.foo)</tt>. This method should be used judiciously; it
   * is typically more clear to invoke the scale directly, passing in the value
   * to be scaled.
   *
   * @function
   * @name pv.Scale.ordinal.prototype.by
   * @param {Function} f an accessor function.
   * @returns {pv.Scale.ordinal} a view of this scale by the specified accessor
   * function.
   */

  pv.copyOwn(scale, pv.Scale.common);

  scale.domain.apply(scale, arguments);
  return scale;
};

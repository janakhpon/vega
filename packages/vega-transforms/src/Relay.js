import {derive, rederive, Transform, tupleid} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Relays a data stream between data processing pipelines.
 * If the derive parameter is set, this transform will create derived
 * copies of observed tuples. This provides derived data streams in which
 * modifications to the tuples do not pollute an upstream data source.
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.derive=false] - Boolean flag indicating if
 *   the transform should make derived copies of incoming tuples.
 * @constructor
 */
export default function Relay(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Relay, Transform);

prototype.transform = function(_, pulse) {
  var out, lut;

  if (this.value) {
    lut = this.value;
  } else {
    out = pulse = pulse.addAll();
    lut = this.value = {};
  }

  if (_.derive) {
    out = pulse.fork(pulse.NO_SOURCE);

    pulse.visit(pulse.REM, function(t) {
      var id = tupleid(t);
      out.rem.push(lut[id]);
      lut[id] = null;
    });

    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[tupleid(t)] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[tupleid(t)]));
    });
  }

  return out;
};

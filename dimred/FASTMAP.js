import { Matrix } from "../matrix/index";
import { euclidean } from "../metrics/index";
import { DR } from "./DR.js";
/**
 * @class
 * @alias FASTMAP
 */
export class FASTMAP extends DR{
    /**
     * 
     * @constructor
     * @memberof module:dimensionality_reduction
     * @alias FASTMAP
     * @param {Matrix} X - the high-dimensional data. 
     * @param {Number} [d = 2] - the dimensionality of the projection.
     * @param {Function} [metric = euclidean] - the metric which defines the distance between two points.  
     * @param {Number} [seed = 1212] - the dimensionality of the projection.
     * @returns {FASTMAP}
     */
    constructor(X, d=2, metric=euclidean, seed=1212) {
        super(X, d, metric, seed);
        this._col = -1;
        return this;
    }

    /**
     * Chooses two points which are the most distant in the actual projection.
     * @private
     * @param {function} dist 
     * @returns {Array} An array consisting of first index, second index, and distance between the two points.
     */
    _choose_distant_objects(dist) {
        const X = this.X;
        const N = X.shape[0];
        let a_index = this._randomizer.random_int % N - 1;
        let b_index = null;
        let max_dist = -Infinity;
        for (let i = 0; i < N; ++i) {
            const d_ai = dist(a_index, i)
            if (d_ai > max_dist) {
                max_dist = d_ai;
                b_index = i;
            }
        }
        max_dist = -Infinity;
        for (let i = 0; i < N; ++i) {
            const d_bi = dist(b_index, i)
            if (d_bi > max_dist) {
                max_dist = d_bi;
                a_index = i;
            }
        }
        return [a_index, b_index, max_dist];
    }

    /**
     * Computes the projection.
     * @returns {Matrix} The {@link d}-dimensional projection of the data matrix {@link X}.
     */
    transform() {
        const X = this.X;
        const N = X.shape[0];
        const d = this._d;
        const metric = this._metric;
        const Y = new Matrix(N, d);
        let dist = (a, b) => metric(X.row(a), X.row(b));
        let old_dist = dist;

        while(this._col < d - 1) {
            this._col += 1;
            let _col = this._col;
            // choose pivot objects
            const [a_index, b_index, d_ab] = this._choose_distant_objects(dist);
            // record id of pivot objects
            //PA[0].push(a_index);
            //PA[1].push(b_index);
            if (d_ab === 0) {
                // because all inter-object distances are zeros
                for (let i = 0; i < N; ++i) {
                    Y.set_entry(i, _col, 0);
                }
            } else {
                // project the objects on the line (O_a, O_b)
                for (let i = 0; i < N; ++i) {
                    const d_ai = dist(a_index, i);
                    const d_bi = dist(b_index, i);
                    const y_i = (d_ai ** 2 + d_ab ** 2 - d_bi ** 2) / (2 * d_ab);
                    Y.set_entry(i, _col, y_i);
                }
                // consider the projections of the objects on a
                // hyperplane perpendicluar to the line (a, b);
                // the distance function D'() between two 
                // projections is given by Eq.4
                dist = (a, b) => Math.sqrt((old_dist(a, b) ** 2) - ((Y.entry(a, _col) - Y.entry(b, _col)) ** 2))
            }
        }
        // return embedding
        this.Y = Y;
        return this.projection;
    }
}
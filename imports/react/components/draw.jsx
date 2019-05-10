import ReactDOM from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';

export class DrawCanvas extends React.Component {
  static propTypes = {
    image: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    path: PropTypes.any,
    onChange: PropTypes.func,
  };

  state = {
    // paths: [ [] ],
    isDrawing: false,
    top: 0,
    left: 0,
  };
  
  canvas = React.createRef();

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this.canvas.current);
    const rect = node.getBoundingClientRect();
    const { left, top } = rect;
    this.setState({ top, left });
  }
    
  handleMouseDown() {
    if (!this.state.isDrawing) {
      this.props.onChange([].concat(this.props.paths, [[]]));
    }
    this.setState({ isDrawing: true });
  };
  
  handleMouseMove(e) {
    if (this.state.isDrawing) {
      const x = e.pageX - this.state.left;
      const y = e.pageY - this.state.top;
      const paths = this.props.paths.slice(0);
      const activePath = paths[paths.length - 1];
      activePath.push({ x, y });
      this.props.onChange(paths);
    }
  };
  
  handleMouseUp() {
    if (this.state.isDrawing) {
      this.setState({ isDrawing: false });
    }
  };
  
  render() {
    const paths = this.props.paths.map(_points => {
      let path = '';
      let points = _points.slice(0);
      if (points.length > 0) {
        path = `M ${points[0].x} ${points[0].y}`;
        var p1, p2, end;
        for (var i = 1; i < points.length - 2; i += 2) {
          p1 = points[i];
          p2 = points[i + 1];
          end = points[i + 2];
          path += ` C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${end.x} ${end.y}`;
        }
      }
      return path;
    }).filter(p => p !== '');
    
    return (
      <svg
        style={{ cursor: 'crosshair', width: this.props.width, height: this.props.height, ...this.props.style }}
        ref={this.canvas}
        onMouseDown={this.handleMouseDown.bind(this)}
        onMouseUp={this.handleMouseUp.bind(this)}
        onMouseMove={this.handleMouseMove.bind(this)}
      >
        <image x={0} y={0} xlinkHref={this.props.image} width={this.props.width} height={this.props.height}/>
        {
          paths.map(path => {
            return (<path
              key={path}
              stroke="blue"
              strokeWidth={2}
              d={path}
              fill="none"
            />);
          })
        }
      </svg>
    );
  }
}
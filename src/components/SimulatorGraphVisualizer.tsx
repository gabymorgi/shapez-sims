import { useMemo, useState, type MouseEvent } from 'react'
import './SimulatorGraphVisualizer.css'
import type { SimulatorGraph } from '../utils/simulatorGraph/SimulatorGraph.ts'
import {
  buildGraphVisualizerLayout,
  type GraphVisualizerEdge,
  type GraphVisualizerLayout,
  type GraphVisualizerNode,
} from '../utils/simulatorGraph/visualizeGraph.ts'

import beltIcon from '../assets/Belt.webp'
import pipeIcon from '../assets/Pipe.webp'
import painterIcon from '../assets/Painter.webp'
import mixerIcon from '../assets/Color-Mixer.webp'
import rotatorIcon from '../assets/Rotator-90.webp'
import generatorIcon from '../assets/Item-Producer.webp'
import stackerIcon from '../assets/Stacker.webp'
import swapperIcon from '../assets/Swapper.webp'
import crystalizerIcon from '../assets/Crystal-Generator.webp'
import trashIcon from '../assets/Trash.webp'
import cutterIcon from '../assets/Cutter.webp'

const EDGE_STYLES = {
  shape: {
    color: '#f97316',
    marker: 'url(#marker-shape)',
  },
  color: {
    color: '#0ea5e9',
    marker: 'url(#marker-color)',
  },
} as const

const ICON_BY_NODE_TYPE: Record<string, string> = {
  Belt: beltIcon,
  Pipe: pipeIcon,
  Painter: painterIcon,
  ColorMixer: mixerIcon,
  Rotator: rotatorIcon,
  Generator: generatorIcon,
  Stacker: stackerIcon,
  Swapper: swapperIcon,
  Crystalizer: crystalizerIcon,
  Trash: trashIcon,
  Cutter: cutterIcon,
}

interface Viewport {
  x: number
  y: number
  scale: number
}

export interface SimulatorGraphVisualizerProps {
  graph?: SimulatorGraph
  layout?: GraphVisualizerLayout
}

const INITIAL_VIEWPORT: Viewport = {
  x: 24,
  y: 24,
  scale: 1,
}

function edgePath(source: GraphVisualizerNode, target: GraphVisualizerNode, laneY: number, nodeWidth: number, nodeHeight: number): string {
  const startX = source.x + nodeWidth
  const startY = source.y + nodeHeight / 2
  const endX = target.x
  const endY = target.y + nodeHeight / 2
  const depthDiff = target.depth - source.depth

  if (depthDiff > 1) {
    const stepX = (target.x - source.x) / depthDiff
    const ghost1X = source.x + stepX + nodeWidth / 2
    const ghost2X = target.x - stepX + nodeWidth / 2
    const curve1 = Math.max(30, Math.abs(ghost1X - startX) * 0.4)
    const curve2 = Math.max(30, Math.abs(endX - ghost2X) * 0.4)

    return [
      `M ${startX} ${startY}`,
      `C ${startX + curve1} ${startY}, ${ghost1X - curve1} ${laneY}, ${ghost1X} ${laneY}`,
      `L ${ghost2X} ${laneY}`,
      `C ${ghost2X + curve2} ${laneY}, ${endX - curve2} ${endY}, ${endX} ${endY}`,
    ].join(' ')
  }

  const horizontalCurve = Math.max(40, Math.abs(endX - startX) * 0.35)
  return `M ${startX} ${startY} C ${startX + horizontalCurve} ${startY}, ${endX - horizontalCurve} ${endY}, ${endX} ${endY}`
}

export function SimulatorGraphVisualizer({ graph, layout }: SimulatorGraphVisualizerProps) {
  const computedLayout = useMemo(() => {
    if (layout) {
      return layout
    }

    if (!graph || graph.size === 0) {
      return null
    }

    return buildGraphVisualizerLayout(graph)
  }, [graph, layout])

  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT)
  const [dragState, setDragState] = useState<{ x: number, y: number } | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

  if (!computedLayout) {
    return (
      <section className="sim-graph-panel">
        <header className="sim-graph-header">
          <h3>Simulator Graph</h3>
          <p>No graph data available.</p>
        </header>
      </section>
    )
  }

  const nodeById = new Map(computedLayout.nodes.map((node) => [node.id, node]))
  const hoveredNode = hoveredNodeId ? nodeById.get(hoveredNodeId) ?? null : null
  const hoveredEdge = hoveredEdgeId
    ? computedLayout.edges.find((edge) => edge.id === hoveredEdgeId) ?? null
    : null

  const onMouseDown = (event: MouseEvent<SVGSVGElement>) => {
    setDragState({ x: event.clientX, y: event.clientY })
  }

  const onMouseUp = () => {
    setDragState(null)
  }

  const onMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!dragState) {
      return
    }

    const deltaX = event.clientX - dragState.x
    const deltaY = event.clientY - dragState.y

    setViewport((current) => ({
      ...current,
      x: current.x + deltaX,
      y: current.y + deltaY,
    }))

    setDragState({ x: event.clientX, y: event.clientY })
  }

  const zoomBy = (factor: number) => {
    setViewport((current) => ({
      ...current,
      scale: Math.max(0.45, Math.min(2.2, current.scale * factor)),
    }))
  }

  return (
    <section className="sim-graph-panel">
      <header className="sim-graph-header">
        <h3>Simulator Graph</h3>
        <p>Layered DAG view. Drag to pan, wheel or controls to zoom.</p>
      </header>

      <div className="sim-graph-toolbar">
        <button type="button" onClick={() => zoomBy(1.15)}>Zoom In</button>
        <button type="button" onClick={() => zoomBy(1 / 1.15)}>Zoom Out</button>
        <button type="button" onClick={() => setViewport(INITIAL_VIEWPORT)}>Reset View</button>
      </div>

      <div className="sim-graph-canvas-wrap">
        <svg
          className="sim-graph-canvas"
          viewBox={`0 0 ${computedLayout.width + 120} ${computedLayout.height + 120}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          // onWheel={onWheel}
          role="img"
          aria-label="Simulator graph visualizer"
        >
          <defs>
            <marker id="marker-shape" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <path d="M0,0 L10,4 L0,8 Z" fill={EDGE_STYLES.shape.color} />
            </marker>
            <marker id="marker-color" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <path d="M0,0 L10,4 L0,8 Z" fill={EDGE_STYLES.color.color} />
            </marker>
          </defs>

          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}>
            {computedLayout.edges.map((edge) => {
              const source = nodeById.get(edge.sourceId)
              const target = nodeById.get(edge.targetId)
              if (!source || !target) {
                return null
              }

              const edgeStyle = EDGE_STYLES[edge.edgeType]
              const highlighted = hoveredEdgeId === edge.id
              const path = edgePath(source, target, edge.laneY, computedLayout.nodeWidth, computedLayout.nodeHeight)

              return (
                <g key={edge.id}>
                  <path
                    className="sim-graph-edge"
                    d={path}
                    stroke={edgeStyle.color}
                    strokeWidth={highlighted ? 4 : 2.4}
                    markerEnd={edgeStyle.marker}
                  />
                  <path
                    className="sim-graph-edge-hitbox"
                    d={path}
                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                  >
                    <title>{edge.hashFlow}</title>
                  </path>
                </g>
              )
            })}

            {computedLayout.nodes.map((node) => {
              const icon = ICON_BY_NODE_TYPE[node.type]
              const highlighted = hoveredNodeId === node.id

              return (
                <g
                  key={node.id}
                  className="sim-graph-node"
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  <rect
                    width={computedLayout.nodeWidth}
                    height={computedLayout.nodeHeight}
                    rx="14"
                    className={highlighted ? 'sim-graph-node-box is-active' : 'sim-graph-node-box'}
                  />
                  {icon ? (
                    <image
                      href={icon}
                      x="10"
                      y="10"
                      width="48"
                      height="48"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : null}
                  <text x="66" y="30" className="sim-graph-node-type">{node.id}</text>
                  <text x="66" y="50" className="sim-graph-node-label">{node.outputHashFlow}</text>
                  {/* <text x="12" y="72" className="sim-graph-node-meta">{node.inputHashFlow} --&gt; {node.outputHashFlow}</text> */}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      <footer className="sim-graph-footer">
        <div className="sim-graph-legend">
          <span className="swatch swatch-shape" />
          <span>Shape Edge</span>
          <span className="swatch swatch-color" />
          <span>Color Edge</span>
        </div>
        <div className="sim-graph-inspector">
          {hoveredNode ? (
            <p>
              Node: {hoveredNode.type} ({hoveredNode.id}), depth {hoveredNode.depth}, lane {hoveredNode.lane}, in {hoveredNode.inputHashFlow}, out {hoveredNode.outputHashFlow}
            </p>
          ) : null}
          {hoveredEdge ? (
            <p>
              Edge: {hoveredEdge.sourceId} to {hoveredEdge.targetId} ({hoveredEdge.edgeType}, {hoveredEdge.throughput}/s, flow {hoveredEdge.hashFlow})
            </p>
          ) : null}
          {!hoveredNode && !hoveredEdge ? <p>Hover a node or edge for details.</p> : null}
        </div>
      </footer>
    </section>
  )
}

export type { GraphVisualizerLayout, GraphVisualizerNode, GraphVisualizerEdge }

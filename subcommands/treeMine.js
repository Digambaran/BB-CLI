const data = {
  name: 'T',
  children: [
    {
      name: 'A',
      children: [
        { name: 'A1' },
        { name: 'A2' },
        { name: 'A3' },
        { name: 'A4' },
        {
          name: 'C',

          children: [
            { name: 'C1' },
            {
              name: 'D',
              children: [{ name: 'D1' }, { name: 'D2' }],
            },
          ],
        },
      ],
    },
    { name: 'Z' },
    {
      name: 'B',
      children: [{ name: 'B1' }, { name: 'B2' }, { name: 'B3' }],
    },
  ],
}
function collapse(d, i) {
  if (d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

function click(d) {
  console.log({ click: d })

  if (d.children) {
    d._children = d.children
    d.children = null
  } else {
    d.children = d._children
    d._children = null
  }
  update(d)
}

function diagonal(s, d) {
  console.log(s, d)
  path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`

  return path
}
const diagonal1 = d3
  .linkHorizontal()
  .x((d) => d.y)
  .y((d) => d.x)

const margin = { top: 20, right: 90, bottom: 30, left: 90 }
const width = 960 - margin.left - margin.right
const height = 500 - margin.top - margin.bottom
const i = 0
const tree = d3.tree().size([height, width])
const root = d3.hierarchy(data, (d) => d.children)
root.x0 = height / 2
root.y0 = 0
root.descendants().forEach((d, i) => {
  d.id = i
  d._children = d.children
  if (d.depth) d.children = null
})

const svg = d3
  .select('body')
  .append('svg')
  .style('user-select', 'none')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', [0, 0, 1920, 1080])
  .style('font', '10px sans-serif')

//   .append('g')
//   .attr('transform', `translate(${margin.left},${margin.top})`)

const gLink = svg
  .append('g')
  .attr('fill', 'none')
  .attr('stroke', '#555')
  .attr('stroke-opacity', 0.4)
  .attr('stroke-width', 1.5)

const gNode = svg.append('g').attr('cursor', 'pointer').attr('pointer-events', 'all')

function update(source) {
  console.log({ source })
  const duration = d3.event && d3.event.altKey ? 2500 : 250
  const nodes = root.descendants()
  const links = root.descendants().slice(1)

  // Compute the new tree layout.
  tree(root)

  nodes.forEach((d) => {
    d.y = d.depth * 90
  })

  const node = svg.selectAll('g.node').data(nodes, (d) => d.id)
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
    .on('click', (event, d) => {
      d.children = d.children ? null : d._children
      update(d)
    })
  nodeEnter
    .attr('class', 'node')
    .attr('r', 1e-6)
    .style('fill', (d) => (d.parent ? 'rgb(39, 43, 77)' : '#fe6e9e'))
  nodeEnter
    .append('rect')
    .attr('rx', (d) => {
      if (d.parent) return d.children || d._children ? 0 : 6
      return 10
    })
    .attr('ry', (d) => {
      if (d.parent) return d.children || d._children ? 0 : 6
      return 10
    })
    .attr('stroke-width', (d) => (d.parent ? 1 : 0))
    .attr('stroke', (d) => (d.children || d._children ? 'rgb(3, 192, 220)' : 'rgb(38, 222, 176)'))
    .attr('stroke-dasharray', (d) => (d.children || d._children ? '0' : '2.2'))
    .attr('stroke-opacity', (d) => (d.children || d._children ? '1' : '0.6'))
    .attr('x', 0)
    .attr('y', -10)
    .attr('width', (d) => (d.parent ? 40 : 20))
    .attr('height', 20)

  nodeEnter
    .append('text')
    .style('fill', (d) => {
      if (d.parent) {
        return d.children || d._children ? '#ffffff' : 'rgb(38, 222, 176)'
      }
      return 'rgb(39, 43, 77)'
    })
    .attr('dy', '.35em')
    .attr('x', (d) => (d.parent ? 20 : 10))
    .attr('text-anchor', (d) => 'middle')
    .text((d) => d.data.name)

  const nodeUpdate = nodeEnter.merge(node)
  console.log({ nodeUpdate })
  nodeUpdate
    .transition()
    .duration(duration)
    .attr('transform', (d) => `translate(${d.y},${d.x})`)
  const nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', (d) => `translate(${source.y},${source.x})`)
    .remove()
  nodeExit.select('rect').style('opacity', 1e-6)
  nodeExit.select('rect').attr('stroke-opacity', 1e-6)
  nodeExit.select('text').style('fill-opacity', 1e-6)
  const link = svg.selectAll('path.link').data(links, (d) => d.id)
  const linkEnter = link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', (d) => {
      const o = { x: source.x0, y: source.y0 }
      return diagonal(o, o)
    })
  const linkUpdate = linkEnter.merge(link)
  console.log('after')
  linkUpdate
    .transition()
    .duration(duration)
    .attr('d', (d) => diagonal(d, d.parent))
  console.log('update')
  const linkExit = link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', (d) => {
      const o = { x: source.x, y: source.y }
      return diagonal(o, o)
    })
    .remove()

  console.log('Final nodes', nodes)
  nodes.forEach((d) => {
    console.log(d)
    d.x0 = d.x
    d.y0 = d.y
  })
}

update(root)

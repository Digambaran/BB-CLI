const data = {
  name: 'pck1',
  details: {
    name: 'pck1',
    type: 'package',
    pid: 123,
    log: 'asdasd',
    url: 'asasdasd',
    status: 'live',
  },
  children: [
    {
      name: 'A',
      details: {
        name: 'A',
        type: 'package',
        pid: 123,
        log: 'asdasd',
        url: 'asasdasd',
        status: 'live',
      },
      children: [
        {
          name: 'A1',
          details: {
            name: 'A1',
            type: 'function',
            pid: 123,
            log: 'asdasd',
            url: 'asasdasd',
            status: 'live',
          },
        },
        {
          name: 'A2',
          details: {
            name: 'A2',
            type: 'function',
            pid: 123,
            log: 'asdasd',
            url: 'asasdasd',
            status: 'live',
          },
        },
        {
          name: 'A3',
          details: {
            name: 'A3',
            type: 'function',
            pid: 123,
            log: 'asdasd',
            url: 'asasdasd',
            status: 'live',
          },
        },
        {
          name: 'A4',
          details: {
            name: 'A4',
            type: 'function',
            pid: 123,
            log: 'asdasd',
            url: 'asasdasd',
            status: 'live',
          },
        },
        {
          name: 'C',
          details: {
            name: 'C',
            type: 'package',
            pid: 123,
            log: 'asdasd',
            url: 'asasdasd',
            status: 'live',
          },
          children: [
            {
              name: 'C1',
              details: {
                name: 'C1',
                type: 'function',
                pid: 123,
                log: 'asdasd',
                url: 'asasdasd',
                status: 'live',
              },
            },
            {
              name: 'D',
              details: {
                name: 'D',
                type: 'package',
                pid: 123,
                log: 'asdasd',
                url: 'asasdasd',
                status: 'live',
              },
              children: [
                {
                  name: 'D1',
                  details: {
                    name: 'D1',
                    type: 'function',
                    pid: 123,
                    log: 'asdasd',
                    url: 'asasdasd',
                    status: 'live',
                  },
                },
                {
                  name: 'D2',
                  details: {
                    name: 'D2',
                    type: 'function',
                    pid: 123,
                    log: 'asdasd',
                    url: 'asasdasd',
                    status: 'live',
                  },
                },
              ],
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

function diagonal(s, d) {
  console.log(s, d)
  path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`

  return path
}

const margin = { top: 20, right: 90, bottom: 30, left: 90 }
const width = 1920 - margin.left - margin.right
const height = 1080 - margin.top - margin.bottom

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
  .attr('xmlns', 'http://www.w3.org/2000/svg')
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
    d.y = d.depth * 300
  })

  const node = svg.selectAll('g.node').data(nodes, (d) => d)
  const nodeTable = node.enter()
  // .append('g')
  // .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
  // .attr('class', 'node')
  // .attr('r', 1e-6)
  nodeTable
    .append('rect')
    .attr('rx', (d) => {
      if (d.parent) return d.children || d._children ? 0 : 60
      return 10
    })
    .attr('ry', (d) => {
      if (d.parent) return d.children || d._children ? 0 : 60
      return 10
    })
    .attr('stroke-width', (d) => (d.parent ? 1 : 0))
    .attr('stroke', (d) => (d.children || d._children ? 'rgb(3, 192, 220)' : 'rgb(38, 222, 176)'))
    .attr('stroke-dasharray', (d) => (d.children || d._children ? '0' : '2.2'))
    .attr('stroke-opacity', (d) => (d.children || d._children ? '1' : '0.6'))
    .attr('x', 0)
    .attr('y', -100)
    .attr('width', (d) => (d.parent ? 100 : 100))
    .attr('height', 200)
  //   append('table').append('tr')
  //   console.log('PPPPP', nodeTable)
  const nodeHead = nodeTable
    .append('foreignObject')
    .attr('x', 100)
    .attr('y', -100)
    .attr('width', 200)
    .attr('height', 200)
    .append('table')
    .attr('xmlns', 'http://www.w3.org/1999/xhtml')
    .append('tbody')
    .append('tr')
    .selectAll('td')
    .data(nodes, (d) => d)
    .enter()
    .append('td')
    .text((d) => {
      console.log(d)
      return d.data.name
    })
  const nodeUpdate = nodeTable.merge(node)
  console.log({ nodeUpdate })
  nodeUpdate
    .transition()
    .duration(duration)
    .attr('transform', (d) => `translate(${d.y},${d.x})`)
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

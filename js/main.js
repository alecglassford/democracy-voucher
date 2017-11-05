import * as d3 from 'd3';

const lineFuncs = {};

const campaigns = new Set([
  'People for Teresa',
  'People for Jon Grant',
  'Elect Lorena',
  'Pat Murakami for Seattle',
  'Holmes for Seattle',
]);

d3.select('#legend')
  .selectAll('li')
  .data(Array.from(campaigns))
  .enter()
  .append('li')
  .style('color', (_, i) => d3.schemeCategory10[i])
  .text(d => d);

const parseVoucher = function parseVoucherFunc(voucher, id) {
  if (!campaigns.has(voucher.campaign)) return null;
  const mdy = voucher.date.split('/');
  return {
    id,
    campaign: voucher.campaign,
    date: new Date(Date.UTC(+`20${mdy[2]}`, +mdy[0] - 1, +mdy[1])),
  };
};

const loadData = function loadDataFunc(err, vouchers) {
  if (err) throw err;
  const dateRange = d3.extent(vouchers, d => d.date);
  const numDays = (dateRange[1] - dateRange[0]) / (1000 * 60 * 60 * 24);
  const dateToNum = d3.scaleTime()
    .domain(dateRange)
    .range([0, numDays]);
  const allDates = [];
  for (let i = 0; i <= numDays; i += 1) {
    allDates.push(dateToNum.invert(i));
  }

  const changeDate = function changeDateFunc() {
    const currDate = dateToNum.invert(+this.value);
    const datesSoFar = allDates.filter(date => date <= currDate);
    d3.select('#slider h2')
      .text(currDate.toUTCString().split('2017')[0]);
    d3.selectAll('g.campaign').each(function editPath(p) {
      d3.select(this).select('path')
        .datum(datesSoFar)
        .attr('d', lineFuncs[p]);
    });
  };

  d3.select('#slider input')
    .attr('min', 0)
    .attr('max', numDays)
    .on('input', changeDate)
    .attr('value', 0);

  const maxCount = d3.max(d3.nest()
    .key(d => d.campaign)
    .rollup(donations => donations.length)
    .entries(vouchers), c => c.value);

  const campaignVouchers = d3.nest()
    .key(d => d.campaign)
    .key(d => d.date)
    .rollup(donations => donations.length)
    .object(vouchers);
  const cumulativeCounts = {};
  Object.keys(campaignVouchers).forEach((campaign) => {
    cumulativeCounts[campaign] = {};
    let prev = 0;
    for (let i = 0; i <= numDays; i += 1) {
      const date = allDates[i];
      const today = campaignVouchers[campaign][date] || 0;
      cumulativeCounts[campaign][date] = prev + today;
      prev = cumulativeCounts[campaign][date];
    }
  });

  const drawPlot = function drawPlotFunc() {
    const viz = d3.select('#viz');
    const vizDimensions = viz.node().getBoundingClientRect();
    const margin = 50;
    const width = vizDimensions.width - (2 * margin);
    const height = vizDimensions.height - (2 * margin);
    const plot = d3.select('#viz').append('g')
      .attr('transform', `translate(${margin},${margin})`);
    const x = d3.scaleTime()
      .domain(dateRange)
      .range([0, width]);
    plot.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    const y = d3.scaleLinear()
      .domain([0, maxCount])
      .range([height, 0]);
    plot.append('g')
      .call(d3.axisLeft(y));

    campaigns.forEach((campaign) => {
      lineFuncs[campaign] = d3.line()
        .x(d => x(d))
        .y(d => y(cumulativeCounts[campaign][d]));
    });

    plot.selectAll('g.campaign')
      .data(Array.from(campaigns))
      .enter()
      .append('g')
      .attr('class', d => `campaign ${d}`)
      .each(function pathAppend(p, i) {
        d3.select(this).append('path')
          .datum(allDates)
          .attr('fill', 'none')
          .attr('stroke', d3.schemeCategory10[i])
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('stroke-width', 1.5)
          .attr('d', lineFuncs[p]);
      });
  };

  drawPlot();
  d3.select('input').transition().duration(10000)
    .attrTween('value', function wat() {
      const i = d3.interpolate(this.value, this.max);
      return (t) => {
        this.value = i(t);
        changeDate.call(this);
      };
    });
};

d3.csv('/data/vouchers.csv', parseVoucher, loadData);

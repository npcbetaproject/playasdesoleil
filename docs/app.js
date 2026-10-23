'use strict';
const DAY = 86400000;
function findTrips(outbound, inbound, options) {
  const [min, max] = options.length.split('-').map(Number);
  const returns = new Map(inbound.filter(r => Number.isFinite(r.price)).map(r => [r.return_date, r.price]));
  const trips = [];
  for (const departure of outbound) {
    if (!Number.isFinite(departure.price) || departure.departure_date < options.from || departure.departure_date > options.to) continue;
    for (let nights = min; nights <= max; nights++) {
      const returnDate = new Date(Date.parse(departure.departure_date + 'T00:00:00Z') + nights * DAY).toISOString().slice(0, 10);
      if (!returns.has(returnDate)) continue;
      const returnPrice = returns.get(returnDate), total = departure.price + returnPrice;
      if (options.budget !== '' && total > Number(options.budget)) continue;
      trips.push({departure: departure.departure_date, returnDate, nights, outbound: departure.price, inbound: returnPrice, total});
    }
  }
  return trips.sort((a,b) => options.sort === 'date' ? a.departure.localeCompare(b.departure) || a.total-b.total : options.sort === 'nights' ? a.nights-b.nights || a.total-b.total : a.total-b.total || a.departure.localeCompare(b.departure) || a.nights-b.nights);
}
if (typeof module !== 'undefined') module.exports = {findTrips};
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const money = amount => 'CAD ' + amount.toLocaleString('en-CA');
  const date = value => new Date(value + 'T00:00:00Z').toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  let outbound = [], inbound = [], trips = [], page = 0;
  const size = 30;
  function render() {
    const body = $('results'); body.replaceChildren();
    for (const trip of trips.slice(page * size, (page + 1) * size)) {
      const row = document.createElement('tr');
      for (const value of [trip.nights,date(trip.departure),date(trip.returnDate)]) {
        const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
      }
      const priceCell = document.createElement('td');
      const total = document.createElement('strong'); total.textContent = money(trip.total);
      const breakdown = document.createElement('span'); breakdown.className = 'breakdown';
      breakdown.textContent = '(' + trip.outbound + '-' + trip.inbound + ')';
      priceCell.append(total); priceCell.append(breakdown); row.append(priceCell);
      body.append(row);
    }
    if (!trips.length) {const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.textContent='No trips match. Try a wider departure range or higher budget.';row.append(cell);body.append(row);}
    const best = trips.reduce((a,b) => !a || b.total < a.total ? b : a, null);
    $('best').textContent = best ? money(best.total) : 'No matching trips';
    $('bestDates').textContent = best ? date(best.departure)+' → '+date(best.returnDate)+' · '+best.nights+' nights' : '';
    $('count').textContent = trips.length.toLocaleString()+' matching combinations';
    $('page').textContent = trips.length ? 'Page '+(page+1)+' of '+Math.ceil(trips.length/size) : '0 results';
    $('prev').disabled = page===0; $('next').disabled = (page+1)*size>=trips.length;
  }
  function filter() {
    $('error').textContent = '';
    if ($('from').value > $('to').value) $('error').textContent='Choose an end date on or after the start date.';
    trips=findTrips(outbound,inbound,{length:$('length').value,from:$('from').value,to:$('to').value,budget:$('budget').value,sort:$('sort').value});
    page=0;render();
  }
  function reset() {
    $('length').value='5-7';$('from').value=outbound[0].departure_date;$('to').value=outbound[outbound.length-1].departure_date;
    $('budget').value='';$('sort').value='price';filter();
  }
  for (const id of ['length','from','to','budget','sort']) $(id).addEventListener('input',filter);
  $('reset').addEventListener('click',()=>{if(outbound.length)reset();});
  $('prev').addEventListener('click',()=>{if(page>0){page--;render();}});
  $('next').addEventListener('click',()=>{if((page+1)*size<trips.length){page++;render();}});
  Promise.all(['flight-prices-2026-10-22.json','return-flight-prices-2026-10-22.json'].map(async file=>{
    const response=await fetch('data/'+file);if(!response.ok)throw new Error('Price data could not be loaded.');return response.json();
  })).then(([out,back])=>{
    outbound=out.observations.filter(r=>Number.isFinite(r.price)).sort((a,b)=>a.departure_date.localeCompare(b.departure_date));
    inbound=back.observations; if(!outbound.length)throw new Error('No departure prices available.');
    for(const id of ['from','to']) {$(id).min=outbound[0].departure_date;$(id).max=outbound[outbound.length-1].departure_date;}
    reset();
  }).catch(error=>{$('error').textContent=error.message+' Please reload the page.';$('best').textContent='Prices unavailable';});
}


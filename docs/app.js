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
  return trips.sort((a,b) => options.sort === 'newest' ? b.departure.localeCompare(a.departure) || a.total-b.total || a.nights-b.nights : options.sort === 'date' ? a.departure.localeCompare(b.departure) || a.total-b.total : options.sort === 'nights' ? a.nights-b.nights || a.total-b.total : a.total-b.total || a.departure.localeCompare(b.departure) || a.nights-b.nights);
}
if (typeof module !== 'undefined') module.exports = {findTrips};
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const money = amount => 'CAD ' + amount.toLocaleString('en-CA');
  const date = value => new Date(value + 'T00:00:00Z').toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  let outbound = [], inbound = [], trips = [], allTrips = [], page = 0, selectedNights = null;
  const size = 30;
  const fullDate = value => new Date(value + 'T00:00:00Z').toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
  const dialog = $('tripDialog');
  function showTrip(trip) {
    const nightsBadge = document.createElement('strong');
    nightsBadge.className = 'trip-nights-badge';
    nightsBadge.textContent = trip.nights + ' nights';
    const destination = document.createElement('span');
    destination.className = 'trip-duration-caption';
    destination.textContent = 'in Costa Rica · round trip';
    $('tripDuration').replaceChildren(nightsBadge, destination);
    $('tripDeparture').textContent = fullDate(trip.departure);
    $('tripReturn').textContent = fullDate(trip.returnDate);
    $('tripOutboundPrice').textContent = money(trip.outbound);
    $('tripInboundPrice').textContent = money(trip.inbound);
    $('tripTotal').textContent = money(trip.total);
    $('tripDiscountNote').hidden = $('discountNote').hidden;
    $('tripDiscountNote').textContent = $('discountNote').textContent;
    dialog.showModal();
  }
  $('closeTripDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  function selectCard(nights, price) {
    selectedNights = nights;
    if (Number.isFinite(price)) $('budget').value = String(price);
    $('sort').value = 'newest';
    filter();
    $('tripResults').focus({preventScroll: true});
    $('tripResults').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  $('allTripsCard').addEventListener('click', () => {
    if (allTrips.length) selectCard(null, Math.min(...allTrips.map(trip => trip.total)));
  });
  $('clearCardSelection').addEventListener('click', () => selectCard(null));
  function render() {
    $('cardSelection').hidden = selectedNights === null;
    $('cardSelectionText').textContent = selectedNights === null ? '' : 'Showing ' + selectedNights + '-night trips.';
    $('allTripsCard').disabled = !allTrips.length;
    $('allTripsCard').setAttribute('aria-pressed', String(selectedNights === null));
    const body = $('results'); body.replaceChildren();
    for (const trip of trips.slice(page * size, (page + 1) * size)) {
      const row = document.createElement('tr');
      row.className = 'trip-row';
      row.tabIndex = 0;
      row.setAttribute('aria-label', 'View trip details: ' + fullDate(trip.departure) + ' to ' + fullDate(trip.returnDate) + ', ' + trip.nights + ' nights, ' + money(trip.total));
      row.setAttribute('aria-haspopup', 'dialog');
      row.addEventListener('click', () => showTrip(trip));
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showTrip(trip); }
      });
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
    const best = allTrips.reduce((a,b) => !a || b.total < a.total ? b : a, null);
    $('best').textContent = best ? money(best.total) : 'No matching trips';
    $('bestDates').textContent = best ? date(best.departure)+' → '+date(best.returnDate)+' · '+best.nights+' nights' : '';
    $('count').textContent = trips.length.toLocaleString()+' matching combinations';
    const cards = document.getElementById('lengthCards');
    if (cards) {
      cards.replaceChildren();
      const [minNights, maxNights] = $('length').value.split('-').map(Number);
      for (let nights = minNights; nights <= maxNights; nights++) {
        const winner = allTrips.filter(trip => trip.nights === nights).reduce((best, trip) =>
          !best || trip.total < best.total || (trip.total === best.total && trip.departure < best.departure) ? trip : best, null);
        const card = document.createElement('button'); card.type = 'button'; card.className = 'price-card';
        card.disabled = !winner;
        card.setAttribute('aria-pressed', String(selectedNights === nights));
        card.setAttribute('aria-label', 'Show ' + nights + '-night trips at ' + (winner ? money(winner.total) : 'the lowest price') + ', latest departure first');
        card.addEventListener('click', () => { if (winner) selectCard(nights, winner.total); });
        const title = document.createElement('h3'); title.textContent = 'Best ' + nights + '-night trip';
        const price = document.createElement('strong'); price.textContent = winner ? money(winner.total) : 'No matching trip';
        if (!winner) price.className = 'no-trip';
        const dates = document.createElement('p');
        dates.textContent = winner ? date(winner.departure) + ' → ' + date(winner.returnDate) : 'Try wider dates or a higher budget.';
        card.append(title); card.append(price); card.append(dates); cards.append(card);
      }
    }
    $('page').textContent = trips.length ? 'Page '+(page+1)+' of '+Math.ceil(trips.length/size) : '0 results';
    $('prev').disabled = page===0; $('next').disabled = (page+1)*size>=trips.length;
  }
  function filter() {
    $('error').textContent = '';
    if ($('from').value > $('to').value) $('error').textContent='Choose an end date on or after the start date.';
    allTrips=findTrips(outbound,inbound,{length:$('length').value,from:$('from').value,to:$('to').value,budget:$('budget').value,sort:$('sort').value});
    trips = selectedNights === null ? allTrips : allTrips.filter(trip => trip.nights === selectedNights);
    page=0;render();
  }
  function reset() {
    selectedNights = null;
    $('length').value='4-7';$('from').value=outbound[0].departure_date;$('to').value=outbound[outbound.length-1].departure_date;
    $('budget').value='';$('sort').value='price';filter();
  }
  for (const id of ['length','from','to','budget','sort']) $(id).addEventListener('input', () => { if (id === 'length') selectedNights = null; filter(); });
  $('reset').addEventListener('click',()=>{if(outbound.length)reset();});
  $('prev').addEventListener('click',()=>{if(page>0){page--;render();}});
  $('next').addEventListener('click',()=>{if((page+1)*size<trips.length){page++;render();}});
  Promise.all(['flight-prices-2026-10-22.json','return-flight-prices-2026-10-22.json'].map(async file=>{
    const response=await fetch('data/'+file, {cache: 'no-store'});if(!response.ok)throw new Error('Price data could not be loaded.');return response.json();
  })).then(([out,back])=>{
    const discountNote = document.getElementById('discountNote');
    if (discountNote) {
      const discount = out.discount_context;
      discountNote.hidden = !discount;
      discountNote.textContent = discount ? 'One-time code ' + discount.code + ' was applied on WestJet. Calendar prices were unchanged; a discount in these prices is not confirmed.' : '';
    }
    const timestamps = [out.refreshed_at, back.refreshed_at].map(value => value ? Date.parse(value) : NaN);
    const stamp = document.getElementById('lastUpdated');
    if (stamp) stamp.textContent = timestamps.every(Number.isFinite)
      ? 'Last updated: ' + new Intl.DateTimeFormat('en-CA', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto'}).format(new Date(Math.min(...timestamps))) + ' (Toronto time)'
      : 'Last updated: unavailable';
    outbound=out.observations.filter(r=>Number.isFinite(r.price)).sort((a,b)=>a.departure_date.localeCompare(b.departure_date));
    inbound=back.observations; if(!outbound.length)throw new Error('No departure prices available.');
    for(const id of ['from','to']) {$(id).min=outbound[0].departure_date;$(id).max=outbound[outbound.length-1].departure_date;}
    const range = document.getElementById('dataRange');
    if (range) {
      const returnDates = inbound.filter(r => Number.isFinite(r.price)).map(r => r.return_date).sort();
      range.textContent = 'Available departures: ' + date(outbound[0].departure_date) + '–' + date(outbound[outbound.length-1].departure_date)
        + (returnDates.length ? ' · Returns through ' + date(returnDates[returnDates.length-1]) : '')
        + '. Date filters apply to departure dates';
    }
    reset();
  }).catch(error=>{$('error').textContent=error.message+' Please reload the page.';$('best').textContent='Prices unavailable';});
}


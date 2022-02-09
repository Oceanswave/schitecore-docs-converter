import { CheerioAPI } from 'cheerio';

export default function fixTables($: CheerioAPI) {
	$('table').each(function (index, el) {
		const myTable = $(el);
		// remove all p tags
		myTable.find('p').each(function() {
			$(this).replaceWith(function () { return $(this).html() || ''; });
		});

    myTable.find('tr').each(function() { $(this).removeAttr('class'); });
    myTable.find('th').each(function() { $(this).removeAttr('class'); });
    myTable.find('td').each(function() { $(this).removeAttr('class'); });
    
		let thead: any = myTable.find('thead');
		let tbody: any = myTable.find('tbody');

		let thRows = myTable.find('tr:has(th)');
		let tdRows = myTable.find('tr:has(td)');

		if (thead.length === 0) {  //if there is no thead element, add one.
			thead = $('<thead></thead>').prependTo(myTable);
		}

		if (tbody.length === 0) {  //if there is no tbody element, add one.
			tbody = $('<tbody></tbody>').appendTo(myTable);
		}

		thRows.clone().appendTo(thead);
		thRows.remove();

		tdRows.clone().appendTo(tbody);
		tdRows.remove();

		// if thead does not have a tr take the first tr from tbody
		if (thead.find('tr').length === 0 && tbody.find('tr').length) {
			var firstRow = tbody.find('tr').first();
			firstRow.appendTo(thead);
		}
	});
}
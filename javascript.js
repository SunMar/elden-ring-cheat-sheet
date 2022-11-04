const data = {
    'general': null,
    'items': null,
    'checkboxes': null,
}

const storage = {
    'section': store.namespace('ercs.section'),
    'checklist': store.namespace('ercs.checklist'),
};

function createSection(sectionId) {
    const accordionItem = $(`<div class="accordion-item cs-section" id="${sectionId}"></div>`);

    const accordionHeader = $(`<h3 class="accordion-header" id="${sectionId}-header"></h3>`);

    const accordionButton = $(`
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${sectionId}-body" aria-expanded="false" aria-controls="${sectionId}-body">
            ${data.checkboxes.sections[sectionId]}
            <span class="cs-progress border-danger bg-danger mx-2 px-2 border border-2 rounded-pill text-light">
                <span id="${sectionId}-done"></span> / <span id="${sectionId}-total"></span>
            </span>
        </button>
    `);

    const accordionButtonDone = $(`<span class="cs-done border-success bg-success mx-2 px-2 border border-2 rounded-pill text-light">${data.general.misc.done}</span>`);
    accordionButtonDone.hide();

    accordionButton.append(accordionButtonDone);
    accordionHeader.append(accordionButton);

    const accordionBody = $(`
        <div id="${sectionId}-body" class="accordion-collapse collapse" aria-labelledby="${sectionId}-header">
            <div class="accordion-body"></div>
        </div>
    `);

    accordionItem.on('show.bs.collapse', {'sectionId': sectionId}, (event) => {
        storage.section.set(event.data.sectionId, true);
    });

    accordionItem.on('hide.bs.collapse', {'sectionId': sectionId}, (event) => {
        storage.section.set(event.data.sectionId, false);
    });

    if (storage.section.get(sectionId)) {
        accordionBody.addClass('show');
        accordionButton.removeClass('collapsed');
        accordionButton.attr('aria-expanded', true);
    }

    accordionItem.append(accordionHeader, accordionBody);

    return accordionItem;
}

function createCheckbox(sectionId, checkboxId, loot, items) {
    const input = $(`<input class="form-check-input" type="checkbox" id="${checkboxId}">`);
    const label = $(`<label class="form-check-label" for="${checkboxId}"></label>`);

    input.on('change', {'sectionId': sectionId, 'checkboxId': checkboxId, 'input': input, 'label': label}, (event) => {
        const checked = input.prop('checked');

        storage.checklist.set(checkboxId, checked);

        if (checked) {
            event.data.label.addClass('cs-done');
            sectionIncrementDone(event.data.sectionId);
        } else {
            event.data.label.removeClass('cs-done');
            sectionDecreaseDone(event.data.sectionId);
        }
    });

    const itemList = [];

    $.each(loot.items, (key, value) => {
        let count, item;

        if (typeof key === "string") {
            count = (parseInt(value, 10) > 1 ? value + 'x ' : '');
            item = key;
        } else {
            count = '';
            item = value;
        }

        let name;

        const itemLocationSeparator = item.indexOf(':');

        if (itemLocationSeparator > -1) {
            const itemLocation = item.substring(itemLocationSeparator+1);
            item = item.substring(0, itemLocationSeparator);
            name = items[item].name[itemLocation];
        } else if (typeof items[item].name === "string") {
            name = items[item].name;
        } else {
            name = items[item].name[Object.keys(items[item].name)[0]];
        }

        itemList.push(`<a href="${items[item].wiki}" target="_blank">${count} ${name} (${data.general.types[items[item].type]})</a>`);
    });

    label.html(`
        ${itemList.join(', ')}: ${loot.location}
        <a href="${loot.guide}" target="_blank"><i class="bi bi-play-btn"></i></a>
        <span class="fst-italic">${data.general.areas[loot.area]}</span>
    `);

    const checkbox = $(`<div class="form-check py-1"></div>`);
    checkbox.append(input, label);

    return checkbox;
}

function sectionDone(sectionId) {
    return $(`#${sectionId}-done`);
}

function sectionIncrementDone(sectionId) {
    sectionUpdateDone(sectionId, parseInt(sectionDone(sectionId).html(), 10) + 1);
}

function sectionDecreaseDone(sectionId) {
    sectionUpdateDone(sectionId, parseInt(sectionDone(sectionId).html(), 10) - 1);
}

function sectionUpdateDone(sectionId, done) {
    const sectionDoneElement = sectionDone(sectionId);

    if (parseInt(sectionDoneElement.html(), 10) === done) {
        return;
    }

    sectionDoneElement.html(done);

    if (done === parseInt($(`#${sectionId}-total`).html(), 10)) {
        $(`#${sectionId}-header .cs-progress`).hide();
        $(`#${sectionId}-header .cs-done`).show();
    } else {
        $(`#${sectionId}-header .cs-progress`).show();
        $(`#${sectionId}-header .cs-done`).hide();
    }
}

$(window).on('load', () => {
    $('#resetChecklist').on('click', () => {
        $('.cs-section').each((index, element) => {
            $(`#${element.id}-body`).collapse('hide');
            sectionUpdateDone(element.id, 0);
        });

        storage.section.clearAll();
        storage.checklist.clearAll();

        $('#resetChecklistModal').modal('hide');
    });

    const generalPromise = $.ajax('eldenring.general.json', {
        'dataType': 'json',
    }).done((response) => {
        data.general = response;
    });

    const itemsPromise = $.ajax('eldenring.items.json', {
        'dataType': 'json',
    }).done((response) => {
        data.items = response;
    });

    const checkboxesPromise = $.ajax('eldenring.checkboxes.json', {
        'dataType': 'json',
    }).done((response) => {
        data.checkboxes = response;
    });

    Promise.all([ generalPromise, itemsPromise, checkboxesPromise ]).then(() => {
        const checklist = $('#checklist');

        $.each(data.checkboxes.list, (sectionId, sectionList) => {
            const section = createSection(sectionId);

            checklist.append(section);

            const counters = {
                'done': 0,
                'total': 0,
            }

            $.each(sectionList, (checkboxId, loot) => {
                const checkbox = createCheckbox(sectionId, checkboxId, loot, data.items.items);
                const done = !!storage.checklist.get(checkboxId);

                counters.total++;

                if (done) {
                    counters.done++;
                    checkbox.find(`#${checkboxId}`).prop('checked', done).trigger('change');
                }

                section.find('.accordion-body').append(checkbox);
            });

            section.find(`#${sectionId}-total`).html(counters.total);
            sectionUpdateDone(sectionId, counters.done);
        });
    });
});

const storage = {
    'section': store.namespace('ercs.section'),
    'checklist': store.namespace('ercs.checklist'),
};

function createSection(id, name, show) {
    let accordionClass;

    if (show) {
        accordionClass = {
            'header': '',
            'body': 'show',
        }
    } else {
        accordionClass = {
            'header': 'collapsed',
            'body': '',
        }
    }

    return $(`
        <div class="accordion-item">
            <h3 class="accordion-header" id="${id}-label">
                <button class="accordion-button ${accordionClass.header}" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="true" aria-controls="${id}">
                    ${name}
                    <span class="ercs-progress mx-2 px-2 border border-2 rounded-pill text-light"><span id="${id}-done"></span> / <span id="${id}-total"></span></span>
                </button>
            </h3>
            <div id="${id}" class="accordion-collapse collapse ${accordionClass.body}" aria-labelledby="${id}-label">
                <div class="accordion-body"></div>
            </div>
        </div>
    `);
}

function createItem(id, name) {
    return $(`
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${id}">
            <label class="form-check-label" for="${id}">${name}</label>
        </div>
    `);
}

function itemChanged(event) {
    storage.checklist.set(this.id, this.checked);

    if (this.checked) {
        event.data.item.find('label').addClass('ecrs-done');
        sectionIncrementDone(event.data.sectionId);
    } else {
        event.data.item.find('label').removeClass('ecrs-done');
        sectionDecreaseDone(event.data.sectionId);
    }
}

function sectionShow(event) {
    console.log('show', event.data.sectionId);
    storage.section.set(event.data.sectionId, true);
}

function sectionHide(event) {
    console.log('hide', event.data.sectionId);
    storage.section.set(event.data.sectionId, false);
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

    const progress = $(`#${sectionId}-label .ercs-progress`);

    if (done === parseInt($(`#${sectionId}-total`).html(), 10)) {
        progress.addClass([ 'border-success', 'bg-success' ]);
        progress.removeClass([ 'border-danger', 'bg-danger' ]);
    } else {
        progress.addClass([ 'border-danger', 'bg-danger' ]);
        progress.removeClass([ 'border-success', 'bg-success' ]);
    }
}

$(window).on('load', function () {
    $.ajax("eldenring.json", {
        'dataType': 'json'
    }).done(function (response) {
        const checklist = $('#checklist');

        $.each(response, function (sectionName, items) {
            const sectionId = sectionName.replace(/\W/g, '');
            const section = createSection(sectionId, sectionName, storage.section.get(sectionId));
            section.on('show.bs.collapse', { 'sectionId': sectionId }, sectionShow);
            section.on('hide.bs.collapse', { 'sectionId': sectionId }, sectionHide);

            checklist.append(section);

            let doneCounter = 0;
            let totalCounter = 0;

            $.each(items, function (itemId, itemName) {
                const item = createItem(itemId, itemName);
                const checkbox = item.find('input[type=checkbox]');
                const done = !!storage.checklist.get(checkbox.prop('id'));

                totalCounter++;

                if (done) {
                    doneCounter++;
                }

                section.find('.accordion-body').append(item);

                item.find('.form-check-input').on(
                    'change',
                    {
                        'sectionId': sectionId,
                        'item': item,
                    },
                    itemChanged
                );

                checkbox.prop('checked', done).trigger('change');
            });

            section.find(`#${sectionId}-total`).html(totalCounter);
            sectionUpdateDone(sectionId, doneCounter);
        });
    });
});

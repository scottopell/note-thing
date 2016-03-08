/// <reference path="../typings/tsd.d.ts" />
"use strict";

declare var markdownit: any;

let schemaBuilder: lf.schema.Builder;
let noteDb: lf.Database;
let noteTable: lf.schema.Table;
let md = markdownit();

$(document).on('ready', function(){
  try{
    initLovefield();
  } catch (e){
    console.error("ERROR INITING lovefield");
  }
  registerEventListeners();
});

async function initLovefield(){
  schemaBuilder = lf.schema.create('notething', 1);

  schemaBuilder.createTable('Note')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('title', lf.Type.STRING)
    .addColumn('content', lf.Type.STRING)
    .addColumn('type', lf.Type.STRING)
    .addColumn('created_at', lf.Type.DATE_TIME)
    .addColumn('modified_at', lf.Type.DATE_TIME)
    .addPrimaryKey(['id'], true)
    .addIndex('idxModified', ['modified_at'], false, lf.Order.DESC);

  let connectOptions = {};

  await schemaBuilder.connect(connectOptions).then(function(db) {
    noteDb = db;
    noteTable = db.getSchema().table('Note');
  });
}

async function createNote(title, content){
  var row = noteTable.createRow({
    'title': title,
    'content': content,
    'type': 'markdown',
    'created_at': new Date(),
    'modified_at': new Date()
  });
  return noteDb.insertOrReplace().into(noteTable).values([row]).exec();
}

async function listNotes() {
  let notes = await noteDb.select().from(noteTable).exec();
  console.log(notes);
}

function registerEventListeners(){
  $(".note-editor").on('input propertychange paste', (e : Event) => {
    $(".preview")[0].innerHTML = md.render((<HTMLTextAreaElement> e.target).value);
  });

  $("h1").on("click", (e) => {
    listNotes();
  });

  $(".save-note").on('click', async (e) => {
    let title = $("#note-title").val();
    let content = $(".note-editor").val();
    try {
      await createNote(title, content);
    } catch (e){
      console.error(`ERROR SAVING NOTE "${title}: ${e}"`);
    }
    console.log("SAVED");

  });

  $("textarea").keydown(function(e) {
    if(e.keyCode === 9) { // tab was pressed
      // get caret position/selection
      let start = this.selectionStart;
      let end = this.selectionEnd;

      let $this = $(this);
      let value = $this.val();

      // set textarea value to: text before caret + tab + text after caret
      $this.val(value.substring(0, start)
                + "\t"
                + value.substring(end));

                // put caret at right position again (add one for the tab)
                this.selectionStart = this.selectionEnd = start + 1;

                // prevent the focus lose
                e.preventDefault();
    }
  });
}

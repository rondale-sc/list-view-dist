function generateContent(n) {
  var content = Ember.A();
  for (var i = 0; i < n; i++) {
    content.push({name: "Item " + (i+1)});
  }
  return content;
}

function extractPositionFromTransform(string) {
  var matched, x, y, position;

  matched = string.match(/translate(?:3d)?\((-?\d+)px,\s*(-?\d+)px/);

  x = parseInt(matched[1], 10);
  y = parseInt(matched[2], 10);

  position = {
    x: x,
    y: y
  };

  return position;
}

function extractNumberFromPosition(string) {
  var number = string.replace(/px/g,'');
  return parseInt(number, 10);
}

function extractPosition(element) {
  var style, position,
    transformProp = Ember.ListViewHelper.transformProp;

  style = element.style;

  if (style.top) {
    position = {
      y: extractNumberFromPosition(style.top),
      x: extractNumberFromPosition(style.left)
    };
  } else if (style[transformProp]) {
    position = extractPositionFromTransform(style[transformProp]);
  }

  return position;
}

function sortElementsByPosition (elements) {
  return elements.sort(function(a, b){
    var aPosition, bPosition;

    aPosition = extractPosition(a);
    bPosition = extractPosition(b);

    if (bPosition.y === aPosition.y){
      return (aPosition.x - bPosition.x);
    } else {
      return (aPosition.y - bPosition.y);
    }
  });
}

function sortByPosition (a, b) {
  var aPosition, bPosition;

  aPosition = a;
  bPosition = b;

  if (bPosition.y === aPosition.y){
    return (aPosition.x - bPosition.x);
  } else {
    return (aPosition.y - bPosition.y);
  }
}

function itemPositions(view) {
  return Ember.A(view.$('.ember-list-item-view').toArray()).map(function(e) {
    return extractPosition(e);
  }).sort(sortByPosition);
}

window.helper = {
  itemPositions: itemPositions,
  generateContent: generateContent,
  sortElementsByPosition: sortElementsByPosition,
  extractPosition: extractPosition
};

var css, view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView integration - Content", {
  setup: function() {
    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("the ember-list helper", function() {
  var content = helper.generateContent(100);

  view = Ember.View.create({
    controller: content,
    template: Ember.Handlebars.compile("{{#ember-list height=500 row-height=50}}{{name}}{{/ember-list}}")
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 11, "The rendered list was updated");
  equal(view.$('.ember-list-container').height(), 5000, "The scrollable view has the correct height");
});

test("the ember-list helper uses items=", function() {
  var content = helper.generateContent(100);

  view = Ember.View.create({
    controller: { itemz: content },
    template: Ember.Handlebars.compile("{{#ember-list items=itemz height=500 row-height=50}}{{name}}{{/ember-list}}")
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 11, "The rendered list was updated");
  equal(view.$('.ember-list-container').height(), 5000, "The scrollable view has the correct height");
});

test("replacing the list content", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  Ember.run(function() {
    view.set('content', Ember.A([{name: 'The only item'}]));
  });

  equal(view.$('.ember-list-item-view').length, 1, "The rendered list was updated");
  equal(view.$('.ember-list-container').height(), 50, "The scrollable view has the correct height");
});

test("adding to the front of the list content", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  Ember.run(function() {
    content.unshiftObject({name: "Item -1"});
  });

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(Ember.$(positionSorted[0]).text(), "Item -1", "The item has been inserted in the list");
  equal(view.$('.ember-list-container').height(), 5050, "The scrollable view has the correct height");
});

test("inserting in the middle of visible content", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  Ember.run(function() {
    content.insertAt(2, {name: "Item 2'"});
  });

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(Ember.$(positionSorted[0]).text(), "Item 1", "The item has been inserted in the list");
  equal(Ember.$(positionSorted[2]).text(), "Item 2'", "The item has been inserted in the list");
});

test("clearing the content", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  Ember.run(function() {
    content.clear();
  });

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(positionSorted.length, 0, "The list should not contain any elements");
});

test("deleting the first element", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(Ember.$(positionSorted[0]).text(), "Item 1", "The item has been inserted in the list");

  Ember.run(function() {
    content.removeAt(0);
  });

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(Ember.$(positionSorted[0]).text(), "Item 2", "The item has been inserted in the list");
});


var css, view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}
var template = Ember.Handlebars.compile("<a {{action 'wat'}}" +
    " href='#'><span class='controller'>{{foo}}</span>" +
    "<span class='context'>{{name}}</span></a>");

var dispatcher;
module("Ember.ListView controllers", {
  setup: function() {
    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');

    dispatcher = Ember.EventDispatcher.create();
    dispatcher.setup();
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      dispatcher.destroy();
      if (view) { view.destroy(); }
    });

    Ember.ENABLE_PROFILING = false;
  }
});

test("parent controller", function() {
  var watWasCalled = false;
  var controller = Ember.Controller.extend({
    foo: 'bar',
    actions: {
      wat: function() {
        watWasCalled = true;
      }
    }
  }).create();

  view = Ember.ContainerView.create({
    controller: controller
  });

  var content = Ember.A([
    { name: 'entry' }
  ]);

  var listView = view.createChildView(Ember.ListView.extend({
    itemViewClass: Ember.ReusableListItemView.extend({
      template: template
    }),
    height: 500,
    rowHeight: 50,
    content: content
  }));

  appendView();

  Ember.run(function(){
    view.pushObject(listView);
  });

  equal(listView.get('controller'), controller);
  equal(listView.get('childViews.firstObject.controller'), controller);

  equal(listView.$('a .controller').text(), '');
  equal(listView.$('a .context').text(), 'entry');

  listView.$('a').trigger('click');

  ok(watWasCalled, 'expected correct action bubbling');
});

test("itemController", function() {
  var container = new Ember.Container();
  var watWasCalled = false;

  container.register('controller:item', Ember.ObjectController.extend({
    foo: 'bar',
    actions: {
      wat: function() {
        watWasCalled = true;
      }
    }
  }));

  var controller = Ember.ArrayController.create({
    content: Ember.A([ { name: 'entry' } ]),
    itemController: 'item',
    container: container
  });

  view = Ember.ContainerView.create();

  var listView = view.createChildView(Ember.ListView.extend({
    itemViewClass: Ember.ReusableListItemView.extend({
      template: template
    }),
    height: 500,
    rowHeight: 50,
    content: controller,
    container: container
  }));

  appendView();

  Ember.run(function(){
    view.pushObject(listView);
  });

  equal(listView.$('a .controller').text(), 'bar');
  equal(listView.$('a .context').text(), 'entry');

  equal(listView.get('childViews.firstObject.controller.foo'), 'bar');

  listView.$('a').trigger('click');

  ok(watWasCalled, 'expected correct action bubbling');
});

if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/helper.js should pass jshint', function() { 
  ok(true, 'list-view/helper.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/list_item_view.js should pass jshint', function() { 
  ok(true, 'list-view/list_item_view.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/list_item_view_mixin.js should pass jshint', function() { 
  ok(true, 'list-view/list_item_view_mixin.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/list_view.js should pass jshint', function() { 
  ok(true, 'list-view/list_view.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/list_view_helper.js should pass jshint', function() { 
  ok(true, 'list-view/list_view_helper.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/list_view_mixin.js should pass jshint', function() { 
  ok(true, 'list-view/list_view_mixin.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/main.js should pass jshint', function() { 
  ok(true, 'list-view/main.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/reusable_list_item_view.js should pass jshint', function() { 
  ok(true, 'list-view/reusable_list_item_view.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/virtual_list_scroller_events.js should pass jshint', function() { 
  ok(true, 'list-view/virtual_list_scroller_events.js should pass jshint.'); 
});

}
if (!QUnit.urlParams.nojshint) {
module('JSHint - list-view');
test('list-view/virtual_list_view.js should pass jshint', function() { 
  ok(true, 'list-view/virtual_list_view.js should pass jshint.'); 
});

}
var css, view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView Acceptance", {
  setup: function() {
    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });

    Ember.ENABLE_PROFILING = false;
  }
});

test("should exist", function() {
  view = Ember.ListView.create({
    height: 500,
    rowHeight: 50
  });
  appendView();
  ok(view);
});

test("should render an empty view when there is no content", function() {
  var content = helper.generateContent(0),
      height = 500,
      rowHeight = 50,
      emptyViewHeight = 175,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      }),
      emptyView = Ember.View.extend({
        attributeBindings: ['style'],
        classNames: ['empty-view'],
        style: 'height:' + emptyViewHeight + 'px;'
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    emptyView: emptyView
  });

  appendView();

  equal(view.get('element').style.height, "500px", "The list view height is correct");
  equal(view.$('.ember-list-container').height(), emptyViewHeight, "The scrollable view has the correct height");

  equal(view.$('.ember-list-item-view').length, 0, "The correct number of rows were rendered");
  equal(view.$('.empty-view').length, 1, "The empty view rendered");

  Ember.run(function () {
    view.set('content', helper.generateContent(10));
  });

  equal(view.get('element').style.height, "500px", "The list view height is correct");
  equal(view.$('.ember-list-container').height(), 500, "The scrollable view has the correct height");

  equal(view.$('.ember-list-item-view').length, 10, "The correct number of rows were rendered");
  equal(view.$('.empty-view').length, 0, "The empty view is removed");

  Ember.run(function () {
    view.set('content', content);
  });

  equal(view.get('element').style.height, "500px", "The list view height is correct");
  equal(view.$('.ember-list-container').height(), emptyViewHeight, "The scrollable view has the correct height");

  equal(view.$('.ember-list-item-view').length, 0, "The correct number of rows were rendered");
  equal(view.$('.empty-view').length, 1, "The empty view rendered");

  Ember.run(function () {
      view.set('content', helper.generateContent(10));
  });

  equal(view.get('element').style.height, "500px", "The list view height is correct");
  equal(view.$('.ember-list-container').height(), 500, "The scrollable view has the correct height");

  equal(view.$('.ember-list-item-view').length, 10, "The correct number of rows were rendered");
  equal(view.$('.empty-view').length, 0, "The empty view has been removed");
});

test("should render a subset of the full content, based on the height, in the correct positions", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  equal(view.get('element').style.height, "500px", "The list view height is correct");
  equal(view.$('.ember-list-container').height(), 5000, "The scrollable view has the correct height");

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");
  equal(Ember.$(positionSorted[0]).text(), "Item 1");
  equal(Ember.$(positionSorted[10]).text(), "Item 11");

  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]);
});

test("should render correctly with an initial scrollTop", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 475
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(Ember.$(positionSorted[0]).text(), "Item 10");
  equal(Ember.$(positionSorted[10]).text(), "Item 20");

  deepEqual(helper.itemPositions(view).map(yPosition), [450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950], "The rows are in the correct positions");
});

test("should perform correct number of renders and repositions on short list init", function () {
  var content = helper.generateContent(8),
      height = 60,
      width = 50,
      rowHeight = 10,
      positions = 0,
      renders = 0,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  Ember.subscribe("view.updateContext.render", {
    before: function(){},
    after: function(name, timestamp, payload) {
      renders++;
    }
  });

  Ember.subscribe("view.updateContext.positionElement", {
    before: function(){},
    after: function(name, timestamp, payload) {
      positions++;
    }
  });

  view = Ember.ListView.create({
    content: content,
    height: height,
    width: width,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  equal(renders, 7, "The correct number of renders occured");
  equal(positions, 14, "The correct number of positions occured");
});

test("should perform correct number of renders and repositions while short list scrolling", function () {
  var content = helper.generateContent(8),
      height = 60,
      width = 50,
      scrollTop = 50,
      rowHeight = 10,
      positions = 0,
      renders = 0,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  if (window.console) {
    Ember.ENABLE_PROFILING = true;
  }

  Ember.subscribe("view.updateContext.render", {
    before: function(){},
    after: function(name, timestamp, payload) {
      renders++;
    }
  });

  Ember.subscribe("view.updateContext.positionElement", {
    before: function(){},
    after: function(name, timestamp, payload) {
      positions++;
    }
  });

  view = Ember.ListView.create({
    content: content,
    height: height,
    width: width,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  Ember.run(function () {
    view.scrollTo(scrollTop);
  });

  equal(renders, 13, "The correct number of renders occured");
  equal(positions, 20, "The correct number of positions occured");
});

test("should perform correct number of renders and repositions on long list init", function () {
  var content = helper.generateContent(200),
      height = 50,
      width = 50,
      rowHeight = 10,
      positions = 0,
      renders = 0,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  Ember.subscribe("view.updateContext.render", {
    before: function(){},
    after: function(name, timestamp, payload) {
      renders++;
    }
  });

  Ember.subscribe("view.updateContext.positionElement", {
    before: function(){},
    after: function(name, timestamp, payload) {
      positions++;
    }
  });

  view = Ember.ListView.create({
    content: content,
    height: height,
    width: width,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  equal(renders, ((height / 10) + 1),  "The correct number of renders occurred");
  equal(positions, 12, "The correct number of positions occurred");
});

test("should be programatically scrollable", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  Ember.run(function() {
    view.scrollTo(475);
  });

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950], "The rows are in the correct positions");
});

function yPosition(position){
  return position.y;
}

function xPosition(position){
  return position.x;
}

test("height change", function(){
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500], "The rows are in the correct positions");

  Ember.run(function() {
    view.set('height', 100);
  });

  equal(view.$('.ember-list-item-view').length, 3, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100], "The rows are in the correct positions");

  Ember.run(function() {
    view.set('height', 50);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50], "The rows are in the correct positions");

  Ember.run(function() {
    view.set('height', 100);
  });

  equal(view.$('.ember-list-item-view').length, 3, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100], "The rows are in the correct positions" );
});

test("adding a column, when everything is already within viewport", function(){
  // start off with 2x3 grid visible and 4 elements
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element, ?: no element
  //
  // x x  --|
  // x x    |- viewport
  // ? ?  --|
  var content = helper.generateContent(4),
      width = 100,
      height = 150,
      rowHeight = 50,
      elementWidth = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("A:{{name}}{{view view.NestedViewClass}}"),
        NestedViewClass: Ember.View.extend({
          tagName: 'span',
          template: Ember.Handlebars.compile("B:{{name}}")
        })
      });

  view = Ember.ListView.create({
    content: content,
    width: width,
    height: height,
    rowHeight: rowHeight,
    elementWidth: elementWidth,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:    0 }, { x: 50, y:    0 },
            { x:  0, y:   50 }, { x: 50, y:   50 }
            ], "initial render: The rows are rendered in the correct positions");

  equal(view.$('.ember-list-item-view').length, 4, "initial render: The correct number of rows were rendered");

  // rotate to a with 3x2 grid visible and 8 elements
  // rapid dimension changes
  Ember.run(function() {
    view.set('width',  140);
  });

  Ember.run(function() {
    view.set('width',  150);
  });

  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // x x x --|
  // x ? ?   |- viewport
  // ? ? ? --|

  equal(view.$('.ember-list-item-view').length, 4, "after width + height change: the correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:  0 }, { x: 50, y: 0 }, { x: 100, y: 0 },
            { x:  0, y: 50 }
            ], "after width + height change: The rows are in the correct positions");

  var sortedElements = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  var texts = Ember.$.map(sortedElements, function(el){ return Ember.$(el).text(); });
  deepEqual(texts, [
             'A:Item 1B:Item 1',
             'A:Item 2B:Item 2',
             'A:Item 3B:Item 3',
             'A:Item 4B:Item 4'
            ], 'after width + height change: elements should be rendered in expected position');
});

test("height and width change after with scroll – simple", function(){
  // start off with 2x3 grid visible and 10 elements, at top of scroll
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // x x  --|
  // x x    |- viewport
  // x x  --|
  // + +
  // 0 0
  var content = helper.generateContent(10);
  var width = 100;
  var height = 150;
  var rowHeight = 50;
  var elementWidth = 50;
  var itemViewClass = Ember.ListItemView.extend({
    template: Ember.Handlebars.compile("A:{{name}}{{view view.NestedViewClass}}"),
    NestedViewClass: Ember.View.extend({
      tagName: 'span',
      template: Ember.Handlebars.compile("B:{{name}}")
    })
  });

  view = Ember.ListView.create({
    content: content,
    width: width,
    height: height,
    rowHeight: rowHeight,
    elementWidth: elementWidth,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:    0 }, { x: 50, y:    0 }, // <- visible
            { x:  0, y:   50 }, { x: 50, y:   50 }, // <- visible
            { x:  0, y:  100 }, { x: 50, y:  100 }, // <- visible
            { x:  0, y:  150 }, { x: 50, y:  150 }  // <- buffer
            ], "initial render: The rows are rendered in the correct positions");

  equal(view.$('.ember-list-item-view').length, 8, "initial render: The correct number of rows were rendered");

  // user is scrolled near the bottom of the list
  Ember.run(function(){
    view.scrollTo(101);
  });
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0 0
  // o o
  // x x --|
  // x x   |- viewport
  // x x --|

  equal(view.$('.ember-list-item-view').length, 8, "after scroll: The correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
              { x: 0, y:  50 }, { x: 50, y:  50 },
              { x: 0, y: 100 }, { x: 50, y: 100 },
              { x: 0, y: 150 }, { x: 50, y: 150 },
/* padding */ { x: 0, y: 200 }, { x: 50, y: 200 }], "after scroll: The rows are in the correct positions");

  // rotate to a with 3x2 grid visible and 8 elements
  Ember.run(function() {
    view.set('width',  150);
    view.set('height', 100);
  });

  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0 0 0
  // x x x
  // x x x --|
  // x o o --|- viewport

  equal(view.$('.ember-list-item-view').length, 4, "after width + height change: the correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
    // /*              */  { x:  50, y:   0 }, { x: 100, y:   0 },
    // { x:   0, y:  50 }, { x:  50, y:  50 }, { x: 100, y:  50 },
    { x:   0, y: 100 }, { x:  50, y: 100 }, { x: 100, y: 100 },
    { x:   0, y: 150 }], "after width + height change: The rows are in the correct positions");

  var sortedElements = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  var texts = Ember.$.map(sortedElements, function(el){ return Ember.$(el).text(); });
  deepEqual(texts, [
    // 'A:Item 2B:Item 2',
    // 'A:Item 3B:Item 3',
    // 'A:Item 4B:Item 4',
    // 'A:Item 5B:Item 5',
    // 'A:Item 6B:Item 6',
    'A:Item 7B:Item 7',
    'A:Item 8B:Item 8',
    'A:Item 9B:Item 9',
    'A:Item 10B:Item 10',
  ], 'after width + height change: elements should be rendered in expected position');
});

test("height and width change after with scroll – 1x2 -> 2x2 with 5 items", function(){
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // x  --|
  // x  --|- viewport
  // +
  // 0
  // 0
  var content = helper.generateContent(5);
  var width = 50;
  var height = 100;
  var rowHeight = 50;
  var elementWidth = 50;
  var itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("A:{{name}}{{view view.NestedViewClass}}"),
        NestedViewClass: Ember.View.extend({
          tagName: 'span',
          template: Ember.Handlebars.compile("B:{{name}}")
        })
      });

  view = Ember.ListView.create({
    content: content,
    width: width,
    height: height,
    rowHeight: rowHeight,
    elementWidth: elementWidth,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:    0 },
            { x:  0, y:   50 },
            { x:  0, y:  100 }
            ], "initial render: The rows are rendered in the correct positions");

  equal(view.$('.ember-list-item-view').length, 3, "initial render: The correct number of rows were rendered");

  // user is scrolled near the bottom of the list
  Ember.run(function(){
    view.scrollTo(151);
  });
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0
  // 0
  // o
  // x --|
  // x --|- viewport
  // 0
  equal(view.$('.ember-list-item-view').length, 3, "after scroll: The correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
              { x: 0, y: 100 },
              { x: 0, y: 150 },
/* padding */ { x: 0, y: 200 }], "after scroll: The rows are in the correct positions");

  // rotate to a with 2x2 grid visible and 8 elements
  Ember.run(function() {
    view.set('width',  100);
    view.set('height', 100);
  });

  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0 0
  // x x --|
  // x o --|- viewport
  // o
  equal(view.$('.ember-list-item-view').length, 3, "after width + height change: the correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
    // { x: 0, y:   0 }, { x: 50, y:   0 },
    { x: 0, y:  50 }, { x: 50, y:  50 },
    { x: 0, y: 100 }
  ], "The rows are in the correct positions");

  var sortedElements = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  var texts = Ember.$.map(sortedElements, function(el){ return Ember.$(el).text(); });

  deepEqual(texts, [
    // 'A:Item 1B:Item 1', 'A:Item 2B:Item 2',
    'A:Item 3B:Item 3', 'A:Item 4B:Item 4',
    'A:Item 5B:Item 5'
  ], 'elements should be rendered in expected position');
});

test("elementWidth change", function(){
  var i;
  var positionSorted;
  var content = helper.generateContent(100);
  var height = 200;
  var width = 200;
  var rowHeight = 50;
  var elementWidth = 100;
  var itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    width: width,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    elementWidth: elementWidth
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 10, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 0   },
            { x:100, y: 0   },
            { x:0,   y: 50  },
            { x:100, y: 50  },
            { x:0 ,  y: 100 },
            { x:100, y: 100 },
            { x:0,   y: 150 },
            { x:100, y: 150 },
            { x:0,   y: 200 },
            { x:100, y: 200 }], "The rows are in the correct positions");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  for(i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i+1));
  }

  Ember.run(function() {
    view.set('width', 100);
  });

  equal(view.$('.ember-list-item-view').length, 5, "The correct number of rows were rendered");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  deepEqual(helper.itemPositions(view), [
            { x: 0, y: 0},
            { x: 0, y: 50},
            { x: 0, y: 100},
            { x: 0, y: 150},
            { x: 0, y: 200}
  ], "The rows are in the correct positions");

  for(i = 0; i < 5; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i+1));
  }

  // Test a width smaller than elementWidth, should behave the same as width === elementWidth
  Ember.run(function () {
    view.set('width', 50);
  });

  equal(view.$('.ember-list-item-view').length, 5, "The correct number of rows were rendered");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  deepEqual(helper.itemPositions(view), [
            { x: 0, y:   0 },
            { x: 0, y:  50 },
            { x: 0, y: 100 },
            { x: 0, y: 150 },
            { x: 0, y: 200 }
  ], "The rows are in the correct positions");

  for(i = 0; i < 5; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i+1));
  }

  ok(view.$().is('.ember-list-view-list'), 'has correct list related class');

  Ember.run(function() {
    view.set('width', 200);
  });

  ok(view.$().is('.ember-list-view-grid'), 'has correct grid related class');
  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 10, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 0   },
            { x:100, y: 0   },
            { x:0,   y: 50  },
            { x:100, y: 50  },
            { x:0 ,  y: 100 },
            { x:100, y: 100 },
            { x:0,   y: 150 },
            { x:100, y: 150 },
            { x:0,   y: 200 },
            { x:100, y: 200 }], "The rows are in the correct positions");

  for(i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i+1));
  }
});

test("elementWidth change with scroll", function(){
  var i,
      positionSorted,
      content = helper.generateContent(100),
      height = 200,
      width = 200,
      rowHeight = 50,
      elementWidth = 100,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    width: width,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    elementWidth: elementWidth
  });

  appendView();

  Ember.run(function(){
    view.scrollTo(1000);
  });

  equal(view.$('.ember-list-item-view').length, 10, "after scroll 1000 - The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 1000 },
            { x:100, y: 1000 },
            { x:0,   y: 1050 },
            { x:100, y: 1050 },
            { x:0 ,  y: 1100 },
            { x:100, y: 1100 },
            { x:0,   y: 1150 },
            { x:100, y: 1150 },
            { x:0,   y: 1200 },
            { x:100, y: 1200 }], "after scroll 1000 - The rows are in the correct positions");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  for (i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i + 41));
  }

  Ember.run(function() {
    view.set('width', 100);
  });

  equal(view.$('.ember-list-item-view').length, 5, " after width 100 -The correct number of rows were rendered");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 2000 },
            { x:0,   y: 2050 },
            { x:0 ,  y: 2100 },
            { x:0,   y: 2150 },
            { x:0,   y: 2200 }], "after width 100 - The rows are in the correct positions");

  for(i = 0; i < 5; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i + 41));
  }

  Ember.run(function() {
    view.set('width', 200);
  });

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 10, "after width 200 - The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 1000 },
            { x:100, y: 1000 },
            { x:0,   y: 1050 },
            { x:100, y: 1050 },
            { x:0 ,  y: 1100 },
            { x:100, y: 1100 },
            { x:0,   y: 1150 },
            { x:100, y: 1150 },
            { x:0,   y: 1200 },
            { x:100, y: 1200 }], "after width 200 - The rows are in the correct positions");

  for(i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i + 41));
  }
});

test("A property of an item can be changed", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  //Change name
  Ember.run(function() {
    content.set('0.name', 'First change');
  });

  equal(view.$('.ember-list-item-view:eq(0)').text(), "First change", "The item's name has been updated");

  //Scroll down, change name, and scroll back up
  Ember.run(function() {
    view.scrollTo(600);
  });

  Ember.run(function() {
    content.set('0.name', 'Second change');
  });

  Ember.run(function() {
    view.scrollTo(0);
  });

  equal(view.$('.ember-list-item-view:eq(0)').text(), "Second change", "The item's name has been updated");

});

test("The list view is wrapped in an extra div to support JS-emulated scrolling", function() {
  view = Ember.ListView.create({
    content: Ember.A(),
    height: 100,
    rowHeight: 50
  });

  appendView();
  equal(view.$('.ember-list-container').length, 1, "expected a ember-list-container wrapper div");
  equal(view.$('.ember-list-container > .ember-list-item-view').length, 0, "expected ember-list-items inside the wrapper div");
});

test("When scrolled past the totalHeight, views should not be recycled in. This is to support overscroll", function() {
  view = Ember.ListView.create({
    content: helper.generateContent(2),
    height:100,
    rowHeight: 50,
    itemViewClass: Ember.ListItemView.extend({
      template: Ember.Handlebars.compile("Name: {{name}}")
    })
  });

  appendView();

  Ember.run(function(){
    view.scrollTo(150);
  });

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 2, "after width 200 - The correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
            { x:0, y:  0 },
            { x:0, y: 50 }] , "went beyond scroll max via overscroll");

  equal(Ember.$(positionSorted[0]).text(), "Name: Item " + 1);
  equal(Ember.$(positionSorted[1]).text(), "Name: Item " + 2);
});


test("When list-view is unable to scroll, scrollTop should be zero", function() {
  view = Ember.ListView.create({
    content: helper.generateContent(2),
    height:400,
    rowHeight: 100,
    itemViewClass: Ember.ListItemView.extend({
      template: Ember.Handlebars.compile("Name: {{name}}")
    })
  });

  appendView();

  Ember.run(function(){
    view.scrollTo(1);
  });

  equal(view.get('scrollTop'), 0, "Scrolltop should be zero");

});


test("Creating a ListView without height and rowHeight properties should throw an exception", function() {
  throws(function() {
    view = Ember.ListView.create({
      content: helper.generateContent(4)
    });

    appendView();
  },
  /Invalid rowHeight: `undefined`/);
});

test("Creating a ListView without height and rowHeight properties should throw an exception", function() {
  throws(function() {
    view = Ember.ListView.create({
      content: helper.generateContent(4)
    });

    appendView();
  },
  /Invalid rowHeight: `undefined`/);
});

test("should trigger scrollYChanged correctly", function () {
  var scrollYChanged = 0, reuseChildren = 0;

  view = Ember.ListView.extend({
    init: function () {
      this.on('scrollYChanged', function () {
        scrollYChanged++;
      });
      this._super();
    },
    _reuseChildren: function () {
      reuseChildren++;
      this._super();
    }
  }).create({
    content: helper.generateContent(10),
    height: 100,
    rowHeight: 50
  });

  appendView();

  equal(scrollYChanged, 0, 'scrollYChanged should not fire on init');

  Ember.run(function () {
    view.scrollTo(1);
  });

  equal(scrollYChanged, 1, 'scrollYChanged should fire after scroll');

  Ember.run(function () {
    view.scrollTo(1);
  });

  equal(scrollYChanged, 1, 'scrollYChanged should not fire for same value');
});

test("should trigger reuseChildren correctly", function () {
  var scrollYChanged = 0, reuseChildren = 0;

  view = Ember.ListView.extend({
    _reuseChildren: function () {
      reuseChildren++;
      this._super();
    }
  }).create({
    content: helper.generateContent(10),
    height: 100,
    rowHeight: 50
  });

  appendView();

  equal(reuseChildren, 1, 'initialize the content');

  Ember.run(function () {
    view.scrollTo(1);
  });

  equal(reuseChildren, 1, 'should not update the content');

  Ember.run(function () {
    view.scrollTo(51);
  });

  equal(reuseChildren, 2, 'should update the content');
});

test("handle strange ratios between height/rowHeight", function() {
  view = Ember.ListView.create({
    content: helper.generateContent(15),
    height: 235,
    rowHeight: 73,
    itemViewClass: Ember.ListItemView.extend({
      template: Ember.Handlebars.compile("Name: {{name}}")
    })
  });

  appendView();

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 5);

  deepEqual(helper.itemPositions(view), [
    { x: 0, y:   0 },
    { x: 0, y:  73 },
    { x: 0, y: 146 },
    { x: 0, y: 219 },
    { x: 0, y: 292 }
  ] , "went beyond scroll max via overscroll");

  var i;
  for (i = 0; i < positionSorted.length; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Name: Item " + (i + 1));
  }

  Ember.run(view, 'scrollTo', 1000);

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 5);

  // expected
  // -----
  // 0   | <-- buffer (since we jump straight to top: 1000)
  // -----
  // 1   |
  // 2   |
  // 3   |
  // 4   | <--- not rendered
  // 5   |
  // 6   |
  // 7   |
  // 8   |
  // 9   |
  // ----
  // 10  | <- (would be nice if this was the buffer, but it would be if we scrolled incrementally and didnt jump)
  // ----
  // 11  | <-- partially visible
  // 12  | <--- visible
  // 13  |
  // 14  |
  // ----
  deepEqual(helper.itemPositions(view), [
    { x: 0, y:    0 }, // <-- buffer
    { x: 0, y:  803 }, // <-- partially visible
    { x: 0, y:  876 }, // <-- in view
    { x: 0, y:  949 }, // <-- in view
    { x: 0, y: 1022 }  // <-- in view
  ], "went beyond scroll max via overscroll");

  equal(Ember.$(positionSorted[0]).text(), "Name: Item 1");

  equal(Ember.$(positionSorted[1]).text(), "Name: Item 12");
  equal(Ember.$(positionSorted[2]).text(), "Name: Item 13");
  equal(Ember.$(positionSorted[3]).text(), "Name: Item 14");
  equal(Ember.$(positionSorted[4]).text(), "Name: Item 15");
});

test("handle bindable rowHeight", function() {
  view = Ember.ListView.create({
    content: helper.generateContent(15),
    height: 400,
    rowHeight: 100,
    itemViewClass: Ember.ListItemView.extend({
      template: Ember.Handlebars.compile("Name: {{name}}")
    })
  });

  appendView();

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 5);
  equal(view.get('totalHeight'), 1500);

  // expected
  // -----
  // 0   |
  // 1   |
  // 2   |
  // 3   |
  // -----
  // 4   | <--- buffer
  // -----
  // 5   |
  // 6   |
  // 7   |
  // 8   |
  // 9   |
  // 10  |
  // 11  |
  // 12  |
  // 13  |
  // 14  |
  // -----
  //
  deepEqual(helper.itemPositions(view), [
    { x:0, y:   0 }, // <- visible
    { x:0, y: 100 }, // <- visible
    { x:0, y: 200 }, // <- visible
    { x:0, y: 300 }, // <- visible
    { x:0, y: 400 }  // <- buffer
  ] , "inDOM views are correctly positioned: before rowHeight change");

  equal(Ember.$(positionSorted[0]).text(), "Name: Item 1");
  equal(Ember.$(positionSorted[1]).text(), "Name: Item 2");
  equal(Ember.$(positionSorted[2]).text(), "Name: Item 3");
  equal(Ember.$(positionSorted[3]).text(), "Name: Item 4");

  Ember.run(view, 'set', 'rowHeight', 200);

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 3);
  equal(view.get('totalHeight'), 3000);

  // expected
  // -----
  // 0   |
  // 1   |
  // ----|
  // 2   | <--- buffer
  // ----|
  // 3   |
  // 4   |
  // 5   |
  // 6   |
  // 7   |
  // 8   |
  // 9   |
  // 10  |
  // 11  |
  // 12  |
  // 13  |
  // 14  |
  // -----
  deepEqual(helper.itemPositions(view), [
    { x:0, y:    0 }, // <-- visible
    { x:0, y:  200 }, // <-- visible
    { x:0, y:  400 }, // <-- buffer
  ], "inDOM views are correctly positioned: after rowHeight change");

  equal(Ember.$(positionSorted[0]).text(), "Name: Item 1");
  equal(Ember.$(positionSorted[1]).text(), "Name: Item 2");
  equal(Ember.$(positionSorted[2]).text(), "Name: Item 3");
});

var css, view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView - Multi-height grid", {
  setup: function() {
    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });

    Ember.ENABLE_PROFILING = false;
  }
});

test("Correct height based on content", function() {
  var content = [
    { id:  1, type: "cat",   height: 100, name: "Andrew" },
    { id:  3, type: "cat",   height: 100, name: "Bruce" },
    { id:  4, type: "other", height: 150, name: "Xbar" },
    { id:  5, type: "dog",   height:  50, name: "Caroline" },
    { id:  6, type: "cat",   height: 100, name: "David" },
    { id:  7, type: "other", height: 150, name: "Xbar" },
    { id:  8, type: "other", height: 150, name: "Xbar" },
    { id:  9, type: "dog",   height:  50, name: "Edward" },
    { id: 10, type: "dog",   height:  50, name: "Francis" },
    { id: 11, type: "dog",   height:  50, name: "George" },
    { id: 12, type: "other", height: 150, name: "Xbar" },
    { id: 13, type: "dog",   height:  50, name: "Harry" },
    { id: 14, type: "cat",   height: 100, name: "Ingrid" },
    { id: 15, type: "other", height: 150, name: "Xbar" },
    { id: 16, type: "cat",   height: 100, name: "Jenn" },
    { id: 17, type: "cat",   height: 100, name: "Kelly" },
    { id: 18, type: "other", height: 150, name: "Xbar" },
    { id: 19, type: "other", height: 150, name: "Xbar" },
    { id: 20, type: "cat",   height: 100, name: "Larry" },
    { id: 21, type: "other", height: 150, name: "Xbar" },
    { id: 22, type: "cat",   height: 100, name: "Manny" },
    { id: 23, type: "dog",   height:  50, name: "Nathan" },
    { id: 24, type: "cat",   height: 100, name: "Ophelia" },
    { id: 25, type: "dog",   height:  50, name: "Patrick" },
    { id: 26, type: "other", height: 150, name: "Xbar" },
    { id: 27, type: "other", height: 150, name: "Xbar" },
    { id: 28, type: "other", height: 150, name: "Xbar" },
    { id: 29, type: "other", height: 150, name: "Xbar" },
    { id: 30, type: "other", height: 150, name: "Xbar" },
    { id: 31, type: "cat",   height: 100, name: "Quincy" },
    { id: 32, type: "dog",   height:  50, name: "Roger" },
  ];

  view = Ember.ListView.create({
    content: Em.A(content),
    height: 300,
    width: 500,
    rowHeight: 100,
    itemViews: {
      cat: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Meow says {{name}} expected: cat === {{type}} {{id}}")
      }),
      dog: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Woof says {{name}} expected: dog === {{type}} {{id}}")
      }),
      other: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Potato says {{name}} expected: other === {{type}} {{id}}")
      })
    },
    itemViewForIndex: function(idx) {
      return this.itemViews[Ember.A(this.get('content')).objectAt(idx).type];
    },
    heightForIndex: function(idx) {
      return Ember.get(Ember.A(this.get('content')).objectAt(idx), 'height');
    }
  });

  appendView();

  equal(view.get('totalHeight'), 3350);

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 5);

  var i, contentIdx;

  equal(Ember.$(positionSorted[0]).text(), "Meow says Andrew expected: cat === cat 1");
  equal(Ember.$(positionSorted[1]).text(), "Meow says Bruce expected: cat === cat 3");
  equal(Ember.$(positionSorted[2]).text(), "Potato says Xbar expected: other === other 4");
  equal(Ember.$(positionSorted[3]).text(), "Woof says Caroline expected: dog === dog 5");

  deepEqual(helper.itemPositions(view), [
    { x:0, y:    0 }, // <-- in view
    { x:0, y:  100 }, // <-- in view
    { x:0, y:  200 }, // <-- in view
    { x:0, y:  350 }, // <-- buffer
    { x:0, y:  400 }  // <-- buffer
  ], 'went beyond scroll max via overscroll');

  Ember.run(view, 'scrollTo', 1000);
  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(Ember.$(positionSorted[0]).text(), "Potato says Xbar expected: other === other 12");
  equal(Ember.$(positionSorted[1]).text(), "Woof says Harry expected: dog === dog 13");
  equal(Ember.$(positionSorted[2]).text(), "Meow says Ingrid expected: cat === cat 14");
  equal(Ember.$(positionSorted[3]).text(), "Potato says Xbar expected: other === other 15");

  deepEqual(helper.itemPositions(view), [
    { x:0, y:  950 }, // <-- partially in view
    { x:0, y: 1100 }, // <-- in view
    { x:0, y: 1150 }, // <-- in view
    { x:0, y: 1250 }, // <-- partially in view
    { x:0, y: 1400 }  // <-- partially in view
  ], 'went beyond scroll max via overscroll');
});

test("with 100% width groups", function() {
  var content = [
    { id: 0, height: 100, width:      100, name: "Andrew"   },
    { id: 1, height: 100, width:      100, name: "Xbar"     },
    { id: 2, height:  25, width: Infinity, name: "Caroline" },
    { id: 3, height: 100, width:      100, name: "David"    },
    { id: 4, height: 100, width: Infinity, name: "Xbar"     },
    { id: 5, height: 100, width: Infinity, name: "Xbar"     },
    { id: 6, height:  25, width:      100, name: "Caroline" },
    { id: 7, height:  25, width:      100, name: "Caroline" },
    { id: 8, height: 100, width:      100, name: "Edward"   },
    { id: 9, height:  25, width:      100, name: "Caroline" }
  ];

  // rowHeight + elementWidth are fallback dimensions
  view = Ember.ListView.create({
    content: Em.A(content),
    height: 100,
    width: 200,
    itemViewClass: Ember.ListItemView.extend({
      template: Ember.Handlebars.compile("{{name}}#{{id}}")
    }),
    heightForIndex: function(idx) {
      return Ember.get(Ember.A(this.get('content')).objectAt(idx), 'height');
    },
    widthForIndex: function (idx) {
      return Ember.get(Ember.A(this.get('content')).objectAt(idx), 'width');
    }
  });

  appendView();

  equal(view.get('totalHeight'), 550);

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 4);

  var i, contentIdx;

  equal(Ember.$(positionSorted[0]).text(), "Andrew#0");
  equal(Ember.$(positionSorted[1]).text(), "Xbar#1");
  equal(Ember.$(positionSorted[2]).text(), "Caroline#2");

  deepEqual(helper.itemPositions(view), [
    { x:   0, y:   0 }, // <-- in view
    { x: 100, y:   0 }, // <-- in view
    { x:  0,  y: 100 }, // <-- buffer
    { x:  0,  y: 125 }, // <-- buffer
  ], '');

  Ember.run(view, 'scrollTo', 100);
  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(Ember.$(positionSorted[0]).text(), 'Xbar#1');
  equal(Ember.$(positionSorted[1]).text(), 'Caroline#2');
  equal(Ember.$(positionSorted[2]).text(), 'David#3');
  equal(Ember.$(positionSorted[3]).text(), 'Xbar#4');

  deepEqual(helper.itemPositions(view), [
    { x: 100, y:   0 }, // <-- in-view
    { x:   0, y: 100 }, // <-- in-view
    { x:   0, y: 125 }, // <-- buffer
    { x:   0, y: 225 }  // <-- buffer
  ], '');
});

var css, view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView - Multi-height", {
  setup: function() {
    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });

    Ember.ENABLE_PROFILING = false;
  }
});

test("Correct height based on content", function() {
  var content = [
    { id:  1, type: "cat",   height: 100, name: "Andrew" },
    { id:  3, type: "cat",   height: 100, name: "Bruce" },
    { id:  4, type: "other", height: 150, name: "Xbar" },
    { id:  5, type: "dog",   height:  50, name: "Caroline" },
    { id:  6, type: "cat",   height: 100, name: "David" },
    { id:  7, type: "other", height: 150, name: "Xbar" },
    { id:  8, type: "other", height: 150, name: "Xbar" },
    { id:  9, type: "dog",   height:  50, name: "Edward" },
    { id: 10, type: "dog",   height:  50, name: "Francis" },
    { id: 11, type: "dog",   height:  50, name: "George" },
    { id: 12, type: "other", height: 150, name: "Xbar" },
    { id: 13, type: "dog",   height:  50, name: "Harry" },
    { id: 14, type: "cat",   height: 100, name: "Ingrid" },
    { id: 15, type: "other", height: 150, name: "Xbar" },
    { id: 16, type: "cat",   height: 100, name: "Jenn" },
    { id: 17, type: "cat",   height: 100, name: "Kelly" },
    { id: 18, type: "other", height: 150, name: "Xbar" },
    { id: 19, type: "other", height: 150, name: "Xbar" },
    { id: 20, type: "cat",   height: 100, name: "Larry" },
    { id: 21, type: "other", height: 150, name: "Xbar" },
    { id: 22, type: "cat",   height: 100, name: "Manny" },
    { id: 23, type: "dog",   height:  50, name: "Nathan" },
    { id: 24, type: "cat",   height: 100, name: "Ophelia" },
    { id: 25, type: "dog",   height:  50, name: "Patrick" },
    { id: 26, type: "other", height: 150, name: "Xbar" },
    { id: 27, type: "other", height: 150, name: "Xbar" },
    { id: 28, type: "other", height: 150, name: "Xbar" },
    { id: 29, type: "other", height: 150, name: "Xbar" },
    { id: 30, type: "other", height: 150, name: "Xbar" },
    { id: 31, type: "cat",   height: 100, name: "Quincy" },
    { id: 32, type: "dog",   height:  50, name: "Roger" },
  ];

  view = Ember.ListView.create({
    content: Em.A(content),
    height: 300,
    width: 500,
    rowHeight: 100,
    itemViews: {
      cat: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Meow says {{name}} expected: cat === {{type}} {{id}}")
      }),
      dog: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Woof says {{name}} expected: dog === {{type}} {{id}}")
      }),
      other: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Potato says {{name}} expected: other === {{type}} {{id}}")
      })
    },
    itemViewForIndex: function(idx) {
      return this.itemViews[Ember.A(this.get('content')).objectAt(idx).type];
    },
    heightForIndex: function(idx) {
      return Ember.get(Ember.A(this.get('content')).objectAt(idx), 'height');
    }
  });

  appendView();

  equal(view.get('totalHeight'), 3350);

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 5);

  var i, contentIdx;

  equal(Ember.$(positionSorted[0]).text(), "Meow says Andrew expected: cat === cat 1");
  equal(Ember.$(positionSorted[1]).text(), "Meow says Bruce expected: cat === cat 3");
  equal(Ember.$(positionSorted[2]).text(), "Potato says Xbar expected: other === other 4");
  equal(Ember.$(positionSorted[3]).text(), "Woof says Caroline expected: dog === dog 5");

  deepEqual(helper.itemPositions(view), [
    { x: 0, y:    0 }, // <-- in view
    { x: 0, y:  100 }, // <-- in view
    { x: 0, y:  200 }, // <-- in view
    { x: 0, y:  350 }, // <-- buffer
    { x: 0, y:  400 }, // <-- buffer
  ], 'went beyond scroll max via overscroll');

  Ember.run(view, 'scrollTo', 1000);
  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(Ember.$(positionSorted[0]).text(), "Potato says Xbar expected: other === other 12");
  equal(Ember.$(positionSorted[1]).text(), "Woof says Harry expected: dog === dog 13");
  equal(Ember.$(positionSorted[2]).text(), "Meow says Ingrid expected: cat === cat 14");
  equal(Ember.$(positionSorted[3]).text(), "Potato says Xbar expected: other === other 15");

  deepEqual(helper.itemPositions(view), [
    { x:0, y:  950 }, // <-- partially in view
    { x:0, y: 1100 }, // <-- in view
    { x:0, y: 1150 }, // <-- in view
    { x:0, y: 1250 }, // <-- partially in view
    { x:0, y: 1400 }  // <-- partially in view
  ], 'went beyond scroll max via overscroll');
});

test("Correct height based on view", function() {
  var content = [
    { id:  1, type: "cat",   name: "Andrew" },
    { id:  3, type: "cat",   name: "Bruce" },
    { id:  4, type: "other", name: "Xbar" },
    { id:  5, type: "dog",   name: "Caroline" },
    { id:  6, type: "cat",   name: "David" },
    { id:  7, type: "other", name: "Xbar" },
    { id:  8, type: "other", name: "Xbar" },
    { id:  9, type: "dog",   name: "Edward" },
    { id: 10, type: "dog",   name: "Francis" },
    { id: 11, type: "dog",   name: "George" },
    { id: 12, type: "other", name: "Xbar" },
    { id: 13, type: "dog",   name: "Harry" },
    { id: 14, type: "cat",   name: "Ingrid" },
    { id: 15, type: "other", name: "Xbar" },
    { id: 16, type: "cat",   name: "Jenn" },
    { id: 17, type: "cat",   name: "Kelly" },
    { id: 18, type: "other", name: "Xbar" },
    { id: 19, type: "other", name: "Xbar" },
    { id: 20, type: "cat",   name: "Larry" },
    { id: 21, type: "other", name: "Xbar" },
    { id: 22, type: "cat",   name: "Manny" },
    { id: 23, type: "dog",   name: "Nathan" },
    { id: 24, type: "cat",   name: "Ophelia" },
    { id: 25, type: "dog",   name: "Patrick" },
    { id: 26, type: "other", name: "Xbar" },
    { id: 27, type: "other", name: "Xbar" },
    { id: 28, type: "other", name: "Xbar" },
    { id: 29, type: "other", name: "Xbar" },
    { id: 30, type: "other", name: "Xbar" },
    { id: 31, type: "cat",   name: "Quincy" },
    { id: 32, type: "dog",   name: "Roger" },
  ];

  view = Ember.ListView.create({
    content: Em.A(content),
    height: 300,
    width: 500,
    rowHeight: 100,
    itemViews: {
      cat: Ember.ListItemView.extend({
        rowHeight: 100,
        template: Ember.Handlebars.compile("Meow says {{name}} expected: cat === {{type}} {{id}}")
      }),
      dog: Ember.ListItemView.extend({
        rowHeight: 50,
        template: Ember.Handlebars.compile("Woof says {{name}} expected: dog === {{type}} {{id}}")
      }),
      other: Ember.ListItemView.extend({
        rowHeight: 150,
        template: Ember.Handlebars.compile("Potato says {{name}} expected: other === {{type}} {{id}}")
      })
    },
    itemViewForIndex: function(idx){
      return this.itemViews[Ember.get(Ember.A(this.get('content')).objectAt(idx), 'type')];
    },
    heightForIndex: function(idx) {
      // proto() is a quick hack, lets just store this on the class..
      return this.itemViewForIndex(idx).proto().rowHeight;
    }
  });

  appendView();

  equal(view.get('totalHeight'), 3350);

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 5);

  var i, contentIdx;

  equal(Ember.$(positionSorted[0]).text(), "Meow says Andrew expected: cat === cat 1");
  equal(Ember.$(positionSorted[1]).text(), "Meow says Bruce expected: cat === cat 3");
  equal(Ember.$(positionSorted[2]).text(), "Potato says Xbar expected: other === other 4");
  equal(Ember.$(positionSorted[3]).text(), "Woof says Caroline expected: dog === dog 5");

  deepEqual(helper.itemPositions(view), [
    { x:0, y:    0 }, // <-- in view
    { x:0, y:  100 }, // <-- in view
    { x:0, y:  200 }, // <-- in view
    { x:0, y:  350 }, // <-- buffer
    { x:0, y:  400 }  // <-- buffer
  ], 'went beyond scroll max via overscroll');

  Ember.run(view, 'scrollTo', 1000);
  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(Ember.$(positionSorted[0]).text(), "Potato says Xbar expected: other === other 12");
  equal(Ember.$(positionSorted[1]).text(), "Woof says Harry expected: dog === dog 13");
  equal(Ember.$(positionSorted[2]).text(), "Meow says Ingrid expected: cat === cat 14");
  equal(Ember.$(positionSorted[3]).text(), "Potato says Xbar expected: other === other 15");

  deepEqual(helper.itemPositions(view), [
    { x:0, y:  950 }, // <-- partially in view
    { x:0, y: 1100 }, // <-- in view
    { x:0, y: 1150 }, // <-- in view
    { x:0, y: 1250 }, // <-- partially in view
    { x:0, y: 1400 }  // <-- partially in view
  ], 'went beyond scroll max via overscroll');
});

test("_numChildViewsForViewport + _startingIndex with multi-height", function() {
  var content = [
  /* index:  0, height: 100 */{ id:  1, type: "cat",   name: "Andrew" },
  /* index:  1, height: 100 */{ id:  2, type: "cat",   name: "Bruce" },
  /* index:  2, height: 150 */{ id:  3, type: "other", name: "Xbar" },
  /* index:  3, height:  50 */{ id:  4, type: "dog",   name: "Caroline" },
  /* index:  4, height: 100 */{ id:  5, type: "cat",   name: "David" },
  /* index:  5, height: 150 */{ id:  6, type: "other", name: "Xbar" },
  /* index:  6, height: 150 */{ id:  7, type: "other", name: "Xbar" },
  /* index:  7, height:  50 */{ id:  8, type: "dog",   name: "Edward" },
  /* index:  8, height:  50 */{ id:  9, type: "dog",   name: "Francis" },
  /* index:  9, height:  50 */{ id: 10, type: "dog",   name: "George" },
  /* index: 10, height: 150 */{ id: 11, type: "other", name: "Xbar" },
  /* index: 11, height:  50 */{ id: 12, type: "dog",   name: "Harry" },
  /* index: 12, height: 100 */{ id: 13, type: "cat",   name: "Ingrid" },
  /* index: 13, height: 150 */{ id: 14, type: "other", name: "Xbar" },
  /* index: 14, height: 100 */{ id: 15, type: "cat",   name: "Jenn" },
  /* index: 15, height: 100 */{ id: 16, type: "cat",   name: "Kelly" },
  /* index: 16, height: 150 */{ id: 17, type: "other", name: "Xbar" },
  /* index: 17, height: 150 */{ id: 18, type: "other", name: "Xbar" },
  /* index: 18, height: 100 */{ id: 19, type: "cat",   name: "Larry" },
  /* index: 19, height: 150 */{ id: 20, type: "other", name: "Xbar" },
  /* index: 20, height: 100 */{ id: 21, type: "cat",   name: "Manny" },
  /* index: 21, height:  50 */{ id: 22, type: "dog",   name: "Nathan" },
  /* index: 22, height: 100 */{ id: 23, type: "cat",   name: "Ophelia" },
  /* index: 23, height:  50 */{ id: 24, type: "dog",   name: "Patrick" },
  /* index: 24, height: 150 */{ id: 25, type: "other", name: "Xbar" },
  /* index: 25, height: 150 */{ id: 26, type: "other", name: "Xbar" },
  /* index: 26, height: 150 */{ id: 27, type: "other", name: "Xbar" },
  /* index: 27, height: 150 */{ id: 28, type: "other", name: "Xbar" },
  /* index: 28, height: 150 */{ id: 29, type: "other", name: "Xbar" },
  /* index: 29, height: 100 */{ id: 30, type: "cat",   name: "Quincy" },
  /* index: 30, height:  50 */{ id: 31, type: "dog",   name: "Roger" },
  ];

  view = Ember.ListView.create({
    content: Em.A(content),
    height: 300,
    width: 500,
    rowHeight: 100,
    itemViews: {
      cat: Ember.ListItemView.extend({
        rowHeight: 100,
        template: Ember.Handlebars.compile("Meow says {{name}} expected: cat === {{type}} {{id}}")
      }),
      dog: Ember.ListItemView.extend({
        rowHeight: 50,
        template: Ember.Handlebars.compile("Woof says {{name}} expected: dog === {{type}} {{id}}")
      }),
      other: Ember.ListItemView.extend({
        rowHeight: 150,
        template: Ember.Handlebars.compile("Potato says {{name}} expected: other === {{type}} {{id}}")
      })
    },
    itemViewForIndex: function(idx){
      return this.itemViews[Ember.get(Ember.A(this.get('content')).objectAt(idx), 'type')];
    },
    heightForIndex: function(idx) {
      // proto() is a quick hack, lets just store this on the class..
      return this.itemViewForIndex(idx).proto().rowHeight;
    }
  });

  appendView();

  equal(view._numChildViewsForViewport(), 5, 'expected _numChildViewsForViewport to be correct (before scroll)');
  equal(view._startingIndex(), 0, 'expected _startingIndex to be correct (before scroll)');

  // entries: 1, 3, 4, 5

  Ember.run(view, 'scrollTo', 1000);

  // entries: 12, 13, 14, 15

  equal(view._numChildViewsForViewport(), 5, 'expected _numChildViewsForViewport to be correct (after scroll)');
  equal(view._startingIndex(), 10, 'expected _startingIndex to be correct (after scroll)');
});

test("handle bindable rowHeight with multi-height (only fallback case)", function() {
  var content = [
    { id:  1, type: "cat",   name: "Andrew" },
    { id:  3, type: "cat",   name: "Bruce" },
    { id:  4, type: "other", name: "Xbar" },
    { id:  5, type: "dog",   name: "Caroline" },
    { id:  6, type: "cat",   name: "David" },
    { id:  7, type: "other", name: "Xbar" },
    { id:  8, type: "other", name: "Xbar" },
    { id:  9, type: "dog",   name: "Edward" },
    { id: 10, type: "dog",   name: "Francis" },
    { id: 11, type: "dog",   name: "George" },
    { id: 12, type: "other", name: "Xbar" },
    { id: 13, type: "dog",   name: "Harry" },
    { id: 14, type: "cat",   name: "Ingrid" },
    { id: 15, type: "other", name: "Xbar" },
    { id: 16, type: "cat",   name: "Jenn" },
    { id: 17, type: "cat",   name: "Kelly" },
    { id: 18, type: "other", name: "Xbar" },
    { id: 19, type: "other", name: "Xbar" },
    { id: 20, type: "cat",   name: "Larry" },
    { id: 21, type: "other", name: "Xbar" },
    { id: 22, type: "cat",   name: "Manny" },
    { id: 23, type: "dog",   name: "Nathan" },
    { id: 24, type: "cat",   name: "Ophelia" },
    { id: 25, type: "dog",   name: "Patrick" },
    { id: 26, type: "other", name: "Xbar" },
    { id: 27, type: "other", name: "Xbar" },
    { id: 28, type: "other", name: "Xbar" },
    { id: 29, type: "other", name: "Xbar" },
    { id: 30, type: "other", name: "Xbar" },
    { id: 31, type: "cat",   name: "Quincy" },
    { id: 32, type: "dog",   name: "Roger" }
  ];

  view = Ember.ListView.create({
    content: Em.A(content),
    height: 300,
    width: 500,
    rowHeight: 100,
    itemViews: {
      other: Ember.ListItemView.extend({
        rowHeight: 150,
        template: Ember.Handlebars.compile("Potato says {{name}} expected: other === {{type}} {{id}}")
      })
    },
    itemViewForIndex: function(idx){
      return this.itemViews[Ember.get(Ember.A(this.get('content')).objectAt(idx), 'type')] || Ember.ReusableListItemView;
    },

    heightForIndex: function(idx) {
      var view = this.itemViewForIndex(idx);

     return view.proto().rowHeight || this.get('rowHeight');
    }
  });

  appendView();

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 4);
  equal(view.get('totalHeight'), 3750);

  // expected
  // -----
  // 0   |
  // 1   |
  // 2   |
  // -----
  // 3   | <--- buffer
  // -----
  // 4   |
  // 5   |
  // 6   |
  // 7   |
  // 8   |
  // 9   |
  // 10  |
  // 11  |
  // 12  |
  // 13  |
  // 14  |
  // -----
  //
  deepEqual(helper.itemPositions(view), [
    { x:0, y:   0 }, // <- visible
    { x:0, y: 100 }, // <- visible
    { x:0, y: 200 }, // <- visible
    { x:0, y: 350 }, // <- buffer
  ] , "inDOM views are correctly positioned: before rowHeight change");

  Ember.run(view, 'set', 'rowHeight', 200);

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 3);
  equal(view.get('totalHeight'), 5550);

  // expected
  // -----
  // 0   |
  // 1   |
  // ----|
  // 2   | <--- buffer
  // ----|
  // 3   |
  // 4   |
  // 5   |
  // 6   |
  // 7   |
  // 8   |
  // 9   |
  // 10  |
  // 11  |
  // 12  |
  // 13  |
  // 14  |
  // -----
  deepEqual(helper.itemPositions(view), [
    { x:0, y:    0 }, // <-- visible
    { x:0, y:  200 }, // <-- visible
    { x:0, y:  400 }, // <-- buffer
  ], "inDOM views are correctly positioned: after rowHeight change");
});

var css, view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView - Multi-height", {
  setup: function() {
    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });

    Ember.ENABLE_PROFILING = false;
  }
});

test("Correct view is used for right data type", function() {
  var content = [
    { id:  1, type: "cat",   name: "Andrew" },
    { id:  3, type: "cat",   name: "Bruce" },
    { id:  4, type: "other", name: "Xbar" },
    { id:  5, type: "dog",   name: "Caroline" },
    { id:  6, type: "cat",   name: "David" },
    { id:  7, type: "other", name: "Xbar" },
    { id:  8, type: "other", name: "Xbar" },
    { id:  9, type: "dog",   name: "Edward" },
    { id: 10, type: "dog",   name: "Francis" },
    { id: 11, type: "dog",   name: "George" },
    { id: 12, type: "other", name: "Xbar" },
    { id: 13, type: "dog",   name: "Harry" },
    { id: 14, type: "cat",   name: "Ingrid" },
    { id: 15, type: "other", name: "Xbar" },
    { id: 16, type: "cat",   name: "Jenn" },
    { id: 17, type: "cat",   name: "Kelly" },
    { id: 18, type: "other", name: "Xbar" },
    { id: 19, type: "other", name: "Xbar" },
    { id: 20, type: "cat",   name: "Larry" },
    { id: 21, type: "other", name: "Xbar" },
    { id: 22, type: "cat",   name: "Manny" },
    { id: 23, type: "dog",   name: "Nathan" },
    { id: 24, type: "cat",   name: "Ophelia" },
    { id: 25, type: "dog",   name: "Patrick" },
    { id: 26, type: "other", name: "Xbar" },
    { id: 27, type: "other", name: "Xbar" },
    { id: 28, type: "other", name: "Xbar" },
    { id: 29, type: "other", name: "Xbar" },
    { id: 30, type: "other", name: "Xbar" },
    { id: 31, type: "cat",   name: "Quincy" },
    { id: 32, type: "dog",   name: "Roger" },
  ];

  view = Ember.ListView.create({
    content: Em.A(content),
    height: 300,
    width: 500,
    rowHeight: 100,
    itemViews: {
      cat: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Meow says {{name}} expected: cat === {{type}} {{id}}")
      }),
      dog: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Woof says {{name}} expected: dog === {{type}} {{id}}")
      }),
      other: Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("Potato says {{name}} expected: other === {{type}} {{id}}")
      })
    },
    itemViewForIndex: function(idx){
      return this.itemViews[this.get('content').objectAt(idx).type];
    }
  });

  appendView();

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 4);

  var i, contentIdx;

  equal(Ember.$(positionSorted[0]).text(), "Meow says Andrew expected: cat === cat 1");
  equal(Ember.$(positionSorted[1]).text(), "Meow says Bruce expected: cat === cat 3");
  equal(Ember.$(positionSorted[2]).text(), "Potato says Xbar expected: other === other 4");
  equal(Ember.$(positionSorted[3]).text(), "Woof says Caroline expected: dog === dog 5");

  deepEqual(helper.itemPositions(view), [
    { x: 0, y:    0 }, // <-- in view
    { x: 0, y:  100 }, // <-- in view
    { x: 0, y:  200 }, // <-- in view
    { x: 0, y:  300 }  // <-- buffer
  ], 'went beyond scroll max via overscroll');

  Ember.run(view, 'scrollTo', 1000);
  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(Ember.$(positionSorted[0]).text(), "Potato says Xbar expected: other === other 12");
  equal(Ember.$(positionSorted[1]).text(), "Woof says Harry expected: dog === dog 13");
  equal(Ember.$(positionSorted[2]).text(), "Meow says Ingrid expected: cat === cat 14");
  equal(Ember.$(positionSorted[3]).text(), "Potato says Xbar expected: other === other 15");

  deepEqual(helper.itemPositions(view), [
    { x:0, y: 1000 }, // <-- partially in view
    { x:0, y: 1100 }, // <-- in view
    { x:0, y: 1200 }, // <-- in view
    { x:0, y: 1300 }  // <-- partially in view
  ], 'went beyond scroll max via overscroll');
});

var view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView unit: - numOfChildViewsForViewport", {
  teardown: function() {
    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

var content = [];
for (var i = 0; i < 20; i++) {
  content[i] = {
    id: i
  };
}

test("computing the number of child views to create with scrollTop zero", function() {
  view = Ember.ListView.create({
    height: 500,
    rowHeight: 50,
    content: Ember.A()
  });

  equal(view._numChildViewsForViewport(), 0);
});

test("computing the number of child views to create after when scroll down a bit", function() {
  view = Ember.ListView.create({
    height: 500,
    rowHeight: 50,
    scrollTop: 51,
    content: Ember.A()
  });
  equal(view._numChildViewsForViewport(), 0);
});

test("computing the number of child views to create with scrollTop zero (With content)", function() {
  view = Ember.ListView.create({
    height: 500,
    rowHeight: 50,
    content: Ember.A(content)
  });

  equal(view._numChildViewsForViewport(), 11);
});

test("computing the number of child views to create after when scroll down a bit (with content)", function() {
  view = Ember.ListView.create({
    height: 500,
    rowHeight: 50,
    scrollTop: 51,
    content: Ember.A(content)
  });
  equal(view._numChildViewsForViewport(), 11);
});


var css, view, helper;
helper = window.helper;
function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView acceptance - View recycling", {
  setup: function() {
    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("recycling complex views long list", function(){
  var content = helper.generateContent(100),
      height = 50,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        innerViewClass: Ember.View.extend({
          didInsertElement: function(){
            innerViewInsertionCount++;
          },
          willDestroyElement: function(){
            innerViewDestroyCount++;
          }
        }),
        template: Ember.Handlebars.compile("{{name}} {{#view view.innerViewClass}}{{/view}}")
      });

  var listViewInsertionCount, listViewDestroyCount,
  innerViewInsertionCount, innerViewDestroyCount;

  listViewInsertionCount = 0;
  listViewDestroyCount = 0;

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 0,
    didInsertElement: function() {
      listViewInsertionCount++;
    },
    willDestroyElement: function() {
      listViewDestroyCount++;
    }
  });

  equal(listViewInsertionCount, 0, "expected number of listView's didInsertElement");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement");

  appendView();

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement");

  equal(innerViewInsertionCount, 2, "expected number of innerView's didInsertElement");
  equal(innerViewDestroyCount, 0, "expected number of innerView's didInsertElement");

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(50);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");

  equal(innerViewInsertionCount, 1, "expected number of innerView's didInsertElement");
  equal(innerViewDestroyCount, 1, "expected number of innerView's willDestroyElement");

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement");

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(0);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");

  equal(innerViewInsertionCount, 1, "expected number of innerView's didInsertElement");
  equal(innerViewDestroyCount, 1, "expected number of innerView's willDestroyElement");

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement");

});

test("recycling complex views short list", function(){
  var content = helper.generateContent(2),
      height = 50,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        innerViewClass: Ember.View.extend({
          didInsertElement: function(){
            innerViewInsertionCount++;
          },
          willDestroyElement: function(){
            innerViewDestroyCount++;
          }
        }),
        template: Ember.Handlebars.compile("{{name}} {{#view view.innerViewClass}}{{/view}}")
      });

  var listViewInsertionCount, listViewDestroyCount,
  innerViewInsertionCount, innerViewDestroyCount;

  listViewInsertionCount = 0;
  listViewDestroyCount = 0;

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 0,
    didInsertElement: function() {
      listViewInsertionCount++;
    },
    willDestroyElement: function() {
      listViewDestroyCount++;
    }
  });

  equal(listViewInsertionCount, 0, "expected number of listView's didInsertElement (pre-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (pre-append)");

  appendView();

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement (post-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (post-append)");

  equal(innerViewInsertionCount, 2, "expected number of innerView's didInsertElement (post-append)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's didInsertElement (post-append)");

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(50);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered (post-scroll to 50)");

  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-scroll to 50)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-scroll to 50)");

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement (post-scroll to 50)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (post-scroll to 50)");

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(0);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered (post-scroll to 0)");

  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-scroll to 0)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-scroll to 0)");

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement (post-scroll to 0)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (post-scroll to 0)");

});

test("recycling complex views long list, with ReusableListItemView", function(){
  var content = helper.generateContent(50),
      height = 50,
      rowHeight = 50,
      itemViewClass = Ember.ReusableListItemView.extend({
        innerViewClass: Ember.View.extend({
          didInsertElement: function(){
            innerViewInsertionCount++;
          },
          willDestroyElement: function(){
            innerViewDestroyCount++;
          }
        }),
        didInsertElement: function(){
          this._super();
          listItemViewInsertionCount++;
        },
        willDestroyElement: function(){
          this._super();
          listItemViewDestroyCount++;
        },
        template: Ember.Handlebars.compile("{{name}} {{#view view.innerViewClass}}{{/view}}")
      });

  var listViewInsertionCount, listViewDestroyCount,
  listItemViewInsertionCount, listItemViewDestroyCount,
  innerViewInsertionCount, innerViewDestroyCount;

  listViewInsertionCount = 0;
  listViewDestroyCount = 0;

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 0,
    didInsertElement: function() {
      listViewInsertionCount++;
    },
    willDestroyElement: function() {
      listViewDestroyCount++;
    }
  });

  equal(listViewInsertionCount, 0, "expected number of listView's didInsertElement (pre-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (pre-append)");
  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (pre-append)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (pre-append)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (pre-append)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (pre-append)");

  appendView();

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement (post-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (post-append)");

  equal(listItemViewInsertionCount, 2, "expected number of listItemView's didInsertElement (post-append)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's didInsertElement (post-append)");

  equal(innerViewInsertionCount, 2, "expected number of innerView's didInsertElement (post-append)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's didInsertElement (post-append)");

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;
  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(50);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered (post-scroll to 50)");

  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (post-scroll to 50)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (post-scroll to 50)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-scroll to 50)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-scroll to 50)");

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;
  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(0);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered (post-scroll to 0)");

  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (post-scroll to 0)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (post-scroll to 0)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-scroll to 0)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-scroll to 0)");
});

test("recycling complex views short list, with ReusableListItemView", function(){
  var content = helper.generateContent(2),
      height = 50,
      rowHeight = 50,
      itemViewClass = Ember.ReusableListItemView.extend({
        innerViewClass: Ember.View.extend({
          didInsertElement: function(){
            innerViewInsertionCount++;
          },
          willDestroyElement: function(){
            innerViewDestroyCount++;
          }
        }),
        didInsertElement: function(){
          this._super();
          listItemViewInsertionCount++;
        },
        willDestroyElement: function(){
          this._super();
          listItemViewDestroyCount++;
        },
        template: Ember.Handlebars.compile("{{name}} {{#view view.innerViewClass}}{{/view}}")
      });

  var listViewInsertionCount, listViewDestroyCount,
  listItemViewInsertionCount, listItemViewDestroyCount,
  innerViewInsertionCount, innerViewDestroyCount;

  listViewInsertionCount = 0;
  listViewDestroyCount = 0;

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 0,
    didInsertElement: function() {
      listViewInsertionCount++;
    },
    willDestroyElement: function() {
      listViewDestroyCount++;
    }
  });

  equal(listViewInsertionCount, 0, "expected number of listView's didInsertElement (pre-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (pre-append)");
  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (pre-append)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (pre-append)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (pre-append)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (pre-append)");

  appendView();

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement (post-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (post-append)");

  equal(listItemViewInsertionCount, 2, "expected number of listItemView's didInsertElement (post-append)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's didInsertElement (post-append)");

  equal(innerViewInsertionCount, 2, "expected number of innerView's didInsertElement (post-append)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's didInsertElement (post-append)");

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;
  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(50);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered (post-scroll to 50)");

  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (post-scroll to 50)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (post-scroll to 50)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-scroll to 50)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-scroll to 50)");

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;
  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(0);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered (post-scroll to 0)");

  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (post-scroll to 0)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (post-scroll to 0)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-scroll to 0)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-scroll to 0)");
});

test("recycling complex views with ReusableListItemView, handling empty slots at the end of the grid", function(){
  var content = helper.generateContent(20),
      height = 150,
      rowHeight = 50,
      width = 100,
      elementWidth = 50,
      itemViewClass = Ember.ReusableListItemView.extend({
        innerViewClass: Ember.View.extend({
          didInsertElement: function(){
            innerViewInsertionCount++;
          },
          willDestroyElement: function(){
            innerViewDestroyCount++;
          }
        }),
        didInsertElement: function(){
          this._super();
          listItemViewInsertionCount++;
        },
        willDestroyElement: function(){
          this._super();
          listItemViewDestroyCount++;
        },
        template: Ember.Handlebars.compile("{{name}} {{#view view.innerViewClass}}{{/view}}")
      });

  var listViewInsertionCount, listViewDestroyCount,
  listItemViewInsertionCount, listItemViewDestroyCount,
  innerViewInsertionCount, innerViewDestroyCount;

  listViewInsertionCount = 0;
  listViewDestroyCount = 0;

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;

  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  view = Ember.ListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    width: width,
    elementWidth: elementWidth,
    itemViewClass: itemViewClass,
    scrollTop: 0,
    didInsertElement: function() {
      listViewInsertionCount++;
    },
    willDestroyElement: function() {
      listViewDestroyCount++;
    }
  });

  equal(listViewInsertionCount, 0, "expected number of listView's didInsertElement (pre-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (pre-append)");
  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (pre-append)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (pre-append)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (pre-append)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (pre-append)");

  appendView();

  equal(listViewInsertionCount, 1, "expected number of listView's didInsertElement (post-append)");
  equal(listViewDestroyCount, 0, "expected number of listView's willDestroyElement (post-append)");

  equal(listItemViewInsertionCount, 8, "expected number of listItemView's didInsertElement (post-append)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's didInsertElement (post-append)");

  equal(innerViewInsertionCount, 8, "expected number of innerView's didInsertElement (post-append)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's didInsertElement (post-append)");

  equal(view.$('.ember-list-item-view').length, 8, "The correct number of items were rendered (post-append)");
  equal(view.$('.ember-list-item-view:visible').length, 8, "The number of items that are not hidden with display:none (post-append)");

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;
  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.scrollTo(350);
  });

  equal(view.$('.ember-list-item-view').length, 8, "The correct number of items were rendered (post-scroll to 350)");
  equal(view.$('.ember-list-item-view:visible').length, 8, "The number of items that are not hidden with display:none (post-scroll to 350)");

  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (post-scroll to 350)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (post-scroll to 350)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-scroll to 350)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-scroll to 350)");

  listItemViewInsertionCount = 0;
  listItemViewDestroyCount = 0;
  innerViewInsertionCount = 0;
  innerViewDestroyCount = 0;

  Ember.run(function() {
    view.set('width', 150);
  });

  equal(view.$('.ember-list-item-view').length, 8, "The correct number of items were rendered (post-expand to 3 columns)");

  equal(listItemViewInsertionCount, 0, "expected number of listItemView's didInsertElement (post-expand to 3 columns)");
  equal(listItemViewDestroyCount, 0, "expected number of listItemView's willDestroyElement (post-expand to 3 columns)");
  equal(innerViewInsertionCount, 0, "expected number of innerView's didInsertElement (post-expand to 3 columns)");
  equal(innerViewDestroyCount, 0, "expected number of innerView's willDestroyElement (post-expand to 3 columns)");

  equal(view.$('.ember-list-item-view:visible').length, 8, "The number of items that are not hidden with display:none (post-expand to 3 columns)");
});

var view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView unit: - scrollTop", {
  teardown: function() {
    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("base case", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(5),
    width: width,
    elementWidth: elementWidth,
    scrollTop: 0
  });

  equal(view.get('scrollTop'), 0);

  Ember.run(function(){
    view.set('width', 150);
  });

  equal(view.get('scrollTop'), 0);
});

test("scroll but within content length", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(5),
    width: width,
    elementWidth: elementWidth,
    scrollTop: 100
  });

  equal(view.get('scrollTop'), 0);

  Ember.run(function(){
    view.set('width', 150);
  });

  equal(view.get('scrollTop'), 0);
});

test("scroll but beyond content length", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(5),
    width: width,
    elementWidth: elementWidth,
    scrollTop: 1000
  });

  equal(view.get('scrollTop'), 0);

  Ember.run(function(){
    view.set('width', 150);
  });

  equal(view.get('scrollTop'), 0);
});


var view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView unit: - startingIndex", {
  teardown: function() {
    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("base case", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(5),
    width: width,
    elementWidth: elementWidth,
    scrollTop: 0
  });

  equal(view._startingIndex(), 0);
});

test("scroll but within content length", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(5),
    width: width,
    elementWidth: elementWidth,
    scrollTop: 100
  });

  equal(view._startingIndex(), 0);
});

test("scroll but beyond content length", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(5),
    width: width,
    elementWidth: elementWidth,
    scrollTop: 1000
  });

  equal(view._startingIndex(), 0);
});


test("larger list", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  // 2x2 grid
  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(50),
    width: width,
    elementWidth: elementWidth,
    scrollTop: 1000
  });

  equal(view._startingIndex(), 30);
});

test("larger list", function(){
  var height = 200, rowHeight = 100, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(40),
    width: width,
    elementWidth: width,
    scrollTop: 100
  });

  equal(view._startingIndex(), 1);
});


var view, helper;
helper = window.helper;

function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.ListView unit - totalHeight", {
  teardown: function() {
    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("single column", function(){
  var height = 500, rowHeight = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(20)
  });

  equal(view.get('totalHeight'), 1000);
});

test("even", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(20),
    width: width,
    elementWidth: elementWidth
  });

  equal(view.get('totalHeight'), 500);
});

test("odd", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(21),
    width: width,
    elementWidth: elementWidth
  });

  equal(view.get('totalHeight'), 550);
});

test("with bottomPadding", function(){
  var height = 500, rowHeight = 50, width = 100, elementWidth = 50;

  view = Ember.ListView.create({
    height: height,
    rowHeight: rowHeight,
    content: helper.generateContent(20),
    width: width,
    elementWidth: elementWidth,
    bottomPadding: 25
  });

  equal(view.get('totalHeight'), 525);
});

var css, view, helper, nextTopPosition;
helper = window.helper;
nextTopPosition = 0;



function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

function fireEvent(type, target) {
  var hasTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch,
    events = hasTouch ? {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend'
    } : {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseend'
    },
    e = document.createEvent('Event');
  if (hasTouch) {
    e.touches = [{target: target}];
  } else {
    e.which = 1;
  }
  e.initEvent(events[type], true, true);
  target.dispatchEvent(e);
}

module("Ember.VirtualListView pull to refresh acceptance", {
  setup: function() {
    window.Scroller = function(callback, opts){
      this.callback = callback;
      this.opts = opts;
      this.scrollTo = function(left, top, zoom) {
        view._scrollerTop = top;
        view._scrollContentTo(Math.max(0, top));
      };
      this.setDimensions = function() { };
      this.doTouchStart = function() {};
      this.doTouchMove = function() {
        this.scrollTo(0, nextTopPosition, 1);
      };
      this.activatePullToRefresh = function(pullToRefreshHeight, activateCallback, deactivateCallback, startCallback){
        this.pullToRefreshHeight = pullToRefreshHeight;
        this.activateCallback = activateCallback;
        this.deactivateCallback = deactivateCallback;
        this.startCallback = startCallback;
      };
      this.finishPullToRefresh = function(){
        this.finishPullToRefreshCalled = true;
      };
      this.doTouchEnd = function() {};
    };

    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("When pulling below zero, show the pull to refresh view", function() {
  expect(12);
  view = Ember.VirtualListView.create({
    content: helper.generateContent(6),
    height: 150,
    rowHeight: 50,
    pullToRefreshViewClass: Ember.View.extend({
      classNames: ['pull-to-refresh'],
      template: Ember.Handlebars.compile("Pull to refresh...")
    }),
    pullToRefreshViewHeight: 75,
    activatePullToRefresh: function() {
      this.pullToRefreshActivated = true;
    },
    deactivatePullToRefresh: function() {
      this.pullToRefreshDeactivated = true;
    },
    startRefresh: function(finishRefresh) {
      this.pullToRefreshStarted = true;
      var view = this;
      stop();
      setTimeout(function(){
        start();
        ok(view.pullToRefreshView.get('refreshing'), 'sets refreshing property on refresh view');
        finishRefresh();
        ok(view.scroller.finishPullToRefreshCalled, 'calls back to scroller');
        ok(!view.pullToRefreshView.get('refreshing'), 'unsets refreshing property on refresh view');
      }, 0);
    }
  });

  appendView();

  var pullToRefreshElement = view.$('.pull-to-refresh')[0];
  ok(pullToRefreshElement, 'pullToRefreshElement was rendered');

  Ember.run(function() {
    view.scrollTo(150);
  });

  pullToRefreshElement = view.$('.pull-to-refresh')[0];
  ok(pullToRefreshElement, 'pullToRefreshElement was rendered');

  equal(view.scroller.pullToRefreshHeight, 75, 'informs scroller of pullToRefreshHeight');
  equal(helper.extractPosition(pullToRefreshElement).y, -75, 'positions pullToRefreshElement');

  view.scroller.activateCallback();
  ok(view.pullToRefreshActivated, 'triggers hook function on activateCallback');
  ok(view.pullToRefreshView.get('active'), 'sets active property on refresh view');

  view.scroller.deactivateCallback();
  ok(view.pullToRefreshDeactivated, 'triggers hook function on deactivateCallback');
  ok(!view.pullToRefreshView.get('active'), 'unsets active property on refresh view');

  view.scroller.startCallback();
  ok(view.pullToRefreshStarted, 'triggers hook function on startCallback');
});


var css, view, helper, nextTopPosition;
helper = window.helper;
nextTopPosition = 0;


function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

function fireEvent(type, target) {
  var hasTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch,
    events = hasTouch ? {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend'
    } : {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseend'
    },
    e = document.createEvent('Event');
  if (hasTouch) {
    e.touches = [{target: target}];
  } else {
    e.which = 1;
  }
  e.initEvent(events[type], true, true);
  target.dispatchEvent(e);
}

module("Ember.VirtualListView scrollerstart acceptance", {
  setup: function() {
    window.Scroller = function(callback, opts){
      this.callback = callback;
      this.opts = opts;
      this.scrollTo = function(left, top, zoom) {
        view._scrollerTop = top;
        view._scrollContentTo(Math.max(0, top));
      };
      this.setDimensions = function() { };
      this.doTouchStart = function() {};
      this.doTouchMove = function() {
        this.scrollTo(0, nextTopPosition, 1);
      };
      this.doTouchEnd = function() {};
    };

    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("When scrolling begins, fire a scrollerstart event on the original target", function() {
  expect(1);
  view = Ember.VirtualListView.create({
    content: helper.generateContent(4),
    height: 150,
    rowHeight: 50
  });

  appendView();

  var childElement = view.$('.ember-list-item-view')[0];
  Ember.$(document).on("scrollerstart", function(e){
    ok(e.target === childElement, "fired scrollerstart on original target");
  });

  Ember.run(function(){
    nextTopPosition = nextTopPosition + 1;
    fireEvent('start', childElement);
    fireEvent('move', childElement);
  });

  Ember.$(document).off("scrollerstart");
});

test("fire scrollerstart event only once per scroll session", function() {
  view = Ember.VirtualListView.create({
    content: helper.generateContent(4),
    height: 150,
    rowHeight: 50
  });

  appendView();

  var childElement = view.$('.ember-list-item-view')[0],
      scrollerstartCount = 0;

  Ember.$(document).on("scrollerstart", function(e){
    scrollerstartCount = scrollerstartCount + 1;
  });

  Ember.run(function(){
    nextTopPosition = nextTopPosition + 1;

    fireEvent('start', childElement);
    fireEvent('move', childElement);
    fireEvent('move', childElement);
  });

  equal(scrollerstartCount, 1, "scrollerstart should fire only once per scroll session");

  Ember.run(function(){
    fireEvent('end', childElement);
    nextTopPosition = nextTopPosition + 1;
    fireEvent('start', childElement);
    fireEvent('move', childElement);
  });

  equal(scrollerstartCount, 2, "scrollerstart should fire again for a new scroll session");

  Ember.$(document).off("scrollerstart");
});

test("doesn't fire scrollerstart event when view did not actually scroll vertically", function() {
  view = Ember.VirtualListView.create({
    content: helper.generateContent(4),
    height: 150,
    rowHeight: 50
  });

  appendView();

  var childElement = view.$('.ember-list-item-view')[0],
      scrollerstartCount = 0;

  Ember.$(document).on("scrollerstart", function(e){
    scrollerstartCount = scrollerstartCount + 1;
  });

  Ember.run(function(){
    nextTopPosition = 0;
    fireEvent('start', childElement);
    fireEvent('move', childElement);
  });

  equal(scrollerstartCount, 0, "scrollerstart should not fire if view did not scroll");

  Ember.run(function(){
    nextTopPosition = nextTopPosition + 1;
    fireEvent('move', childElement);
  });

  equal(scrollerstartCount, 1, "scrollerstart should fire if view scrolled");

  Ember.$(document).off("scrollerstart");
});

test("When pulling below zero, still fire a scrollerstart event", function() {
  expect(1);
  view = Ember.VirtualListView.create({
    content: helper.generateContent(4),
    height: 150,
    rowHeight: 50
  });

  appendView();

  var childElement = view.$('.ember-list-item-view')[0];
  Ember.$(document).on("scrollerstart", function(e){
    ok(true, "fired scrollerstart");
  });

  Ember.run(function(){
    nextTopPosition = nextTopPosition - 10;
    fireEvent('start', childElement);
    fireEvent('move', childElement);
  });

  Ember.$(document).off("scrollerstart");
});


var setDimensionsCalled = 0,
    css, view, helper, scrollingDidCompleteCount,
    didInitializeScrollerCount, scrollerDimensionsDidChange;

helper = window.helper;


function appendView() {
  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });
}

module("Ember.VirtualListView Acceptance", {
  setup: function() {
    window.Scroller = function(callback, opts){
      this.callback = callback;
      this.opts = opts;
      this.scrollTo = function(left, top, zoom) {
        view._scrollContentTo(Math.max(0, top));
      };
      this.setDimensions = function() { setDimensionsCalled = setDimensionsCalled + 1; };
      this.doTouchStart = function() {};
      this.doTouchMove = function() {};
      this.doTouchEnd = function() {};
    }

    css = Ember.$("<style>" +
            ".ember-list-view {" +
            "  overflow: auto;" +
            "  position: relative;" +
            "}" +
            ".ember-list-item-view {" +
            "  position: absolute;" +
            "}" +
            ".is-selected {" +
            "  background: red;" +
            "}" +
            "</style>").appendTo('head');
  },
  teardown: function() {
    css.remove();

    Ember.run(function() {
      if (view) { view.destroy(); }
    });
  }
});

test("should exist", function() {
  view = Ember.VirtualListView.create({
    height: 500,
    rowHeight: 50
  });
  appendView();
  ok(view);
});

test("should render a subset of the full content, based on the height, in the correct positions", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  equal(view.get('element').style.height, "500px", "The list view height is correct");
  // equal(view.$(':last')[0].style.height, "5000px", "The scrollable view has the correct height");

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");
  equal(Ember.$(positionSorted[0]).text(), "Item 1");
  equal(Ember.$(positionSorted[10]).text(), "Item 11");

  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]);
});

test("should update dimensions of scroller when totalHeight changes", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();
  setDimensionsCalled = 0;

  Ember.run(function(){
    content.pushObject({name: "New Item"});
  });

  equal(setDimensionsCalled, 1, "setDimensions was called on the scroller");
});

test("lifecycle events", function(){
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      }),
    scrollingDidCompleteCount = 0,
    didInitializeScrollerCount = 0,
    scrollerDimensionsDidChangeCount = 0;

  view = Ember.VirtualListView.extend({
    init: function(){
      // Some hooks for testing
      this.on('didInitializeScroller', function(){ didInitializeScrollerCount++; });
      this.on('scrollingDidComplete',  function(){ scrollingDidCompleteCount++;  });
      this.on('scrollerDimensionsDidChange',  function(){ scrollerDimensionsDidChangeCount++;  });
      this._super();
    }
  }).create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 475
  });

  equal(didInitializeScrollerCount, 1, 'didInitializeScroller event was fired on create');
  equal(scrollerDimensionsDidChangeCount, 1, 'scrollerDimensionsDidChangeCount event was fired on create');
  equal(scrollingDidCompleteCount, 0, 'scrollingDidCompleteCount event was NOT fired on create');

  appendView();

  Ember.run(function(){
    view.set('height', height + 1);
  });

  equal(didInitializeScrollerCount, 1, 'didInitializeScroller event was fired on create');
  equal(scrollerDimensionsDidChangeCount, 2, 'scrollerDimensionsDidChangeCount event was fired on create');
  equal(scrollingDidCompleteCount, 0, 'scrollingDidCompleteCount event was NOT fired on create');

  Ember.run(function(){
    view.scrollTo(0, true);
    view.scroller.opts.scrollingComplete();
  });

  equal(didInitializeScrollerCount, 1, 'didInitializeScroller event was fired on create');
  equal(scrollerDimensionsDidChangeCount, 2, 'scrollerDimensionsDidChangeCount event was fired on create');
  equal(scrollingDidCompleteCount, 1, 'scrollingDidCompleteCount event was NOT fired on create');
});

test("should render correctly with an initial scrollTop", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    scrollTop: 475
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");

  var positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  equal(Ember.$(positionSorted[0]).text(), "Item 10");
  equal(Ember.$(positionSorted[10]).text(), "Item 20");

  deepEqual(helper.itemPositions(view).map(yPosition), [450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950], "The rows are in the correct positions");
});

test("should be programatically scrollable", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  Ember.run(function() {
    view.scrollTo(475);
  });

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950], "The rows are in the correct positions");
});

function yPosition(position){
  return position.y;
}

function xPosition(position){
  return position.x;
}

test("height change", function(){
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 11, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500], "The rows are in the correct positions");

  Ember.run(function() {
    view.set('height', 100);
  });

  equal(view.$('.ember-list-item-view').length, 3, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100], "The rows are in the correct positions");

  Ember.run(function() {
    view.set('height', 50);
  });

  equal(view.$('.ember-list-item-view').length, 2, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50], "The rows are in the correct positions");

  Ember.run(function() {
    view.set('height', 100);
  });

  equal(view.$('.ember-list-item-view').length, 3, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view).map(yPosition), [0, 50, 100], "The rows are in the correct positions" );
});

test("height and width change after with scroll – simple", function(){
  // start off with 2x3 grid visible and 10 elements, at top of scroll
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // x x  --|
  // x x    |- viewport
  // x x  --|
  // + +
  // 0 0
  var content = helper.generateContent(10),
      width = 100,
      height = 150,
      rowHeight = 50,
      elementWidth = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("A:{{name}}{{view view.NestedViewClass}}"),
        NestedViewClass: Ember.View.extend({
          tagName: 'span',
          template: Ember.Handlebars.compile("B:{{name}}")
        })
      });

  view = Ember.VirtualListView.create({
    content: content,
    width: width,
    height: height,
    rowHeight: rowHeight,
    elementWidth: elementWidth,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:    0 }, { x: 50, y:    0 },
            { x:  0, y:   50 }, { x: 50, y:   50 },
            { x:  0, y:  100 }, { x: 50, y:  100 },
            { x:  0, y:  150 }, { x: 50, y:  150 }
            ], "initial render: The rows are rendered in the correct positions");

  equal(view.$('.ember-list-item-view').length, 8, "initial render: The correct number of rows were rendered");

  // user is scrolled near the bottom of the list
  Ember.run(function(){
    view.scrollTo(101);
  });
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0 0
  // 0 0
  // x x --|
  // x x   |- viewport
  // x x --|
  // o o

  equal(view.$('.ember-list-item-view').length, 8, "after scroll: The correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
              { x: 0, y:  50 }, { x: 50, y:  50 },
              { x: 0, y: 100 }, { x: 50, y: 100 },
              { x: 0, y: 150 }, { x: 50, y: 150 },
/* padding */ { x: 0, y: 200 }, { x: 50, y: 200 }], "after scroll: The rows are in the correct positions");

  // rotate to a with 3x2 grid visible and 8 elements
  Ember.run(function() {
    view.set('width',  150);
    view.set('height', 100);
  });

  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0 0 0
  // x x x
  // x x x --|
  // x o o --|- viewport

  equal(view.$('.ember-list-item-view').length, 4, "after width + height change: the correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
    // /*              */  { x:  50, y:   0 }, { x: 100, y:   0 },
    // { x:   0, y:  50 }, { x:  50, y:  50 }, { x: 100, y:  50 },
    { x:   0, y: 100 }, { x:  50, y: 100 }, { x: 100, y: 100 },
    { x:   0, y: 150 }], "after width + height change: The rows are in the correct positions");

  var sortedElements = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  var texts = Ember.$.map(sortedElements, function(el){ return Ember.$(el).text(); });
  deepEqual(texts, [
    // 'A:Item 2B:Item 2',
    // 'A:Item 3B:Item 3',
    // 'A:Item 4B:Item 4',
    // 'A:Item 5B:Item 5',
    // 'A:Item 6B:Item 6',
    'A:Item 7B:Item 7',
    'A:Item 8B:Item 8',
    'A:Item 9B:Item 9',
    'A:Item 10B:Item 10',
  ], 'after width + height change: elements should be rendered in expected position');
});

test("height and width change after with scroll – 1x2 -> 2x2 with 5 items", function() {
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // x  --|
  // x  --|- viewport
  // +
  // 0
  // 0
  var content = helper.generateContent(5);
  var width = 50;
  var height = 100;
  var rowHeight = 50;
  var elementWidth = 50;
  var itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("A:{{name}}{{view view.NestedViewClass}}"),
        NestedViewClass: Ember.View.extend({
          tagName: 'span',
          template: Ember.Handlebars.compile("B:{{name}}")
        })
      });

  view = Ember.VirtualListView.create({
    content: content,
    width: width,
    height: height,
    rowHeight: rowHeight,
    elementWidth: elementWidth,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:    0 },
            { x:  0, y:   50 },
            { x:  0, y:  100 }
            ], "initial render: The rows are rendered in the correct positions");

  equal(view.$('.ember-list-item-view').length, 3, "initial render: The correct number of rows were rendered");

  // user is scrolled near the bottom of the list
  Ember.run(function(){
    view.scrollTo(151);
  });
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0
  // 0
  // 0
  // x --|
  // x --|- viewport
  // o
  equal(view.$('.ember-list-item-view').length, 3, "after scroll: The correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
              { x: 0, y: 100 },
              { x: 0, y: 150 },
/* padding */ { x: 0, y: 200 }], "after scroll: The rows are in the correct positions");

  // rotate to a with 2x2 grid visible and 8 elements
  Ember.run(function() {
    view.set('width',  100);
    view.set('height', 100);
  });

  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // 0 0
  // 0 0
  // x x --|- viewport
  // x   --|
  equal(view.$('.ember-list-item-view').length, 3, "after width + height change: the correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
    { x: 0, y:  50 }, { x: 50, y:  50 },
    { x: 0, y: 100 }
  ], "The rows are in the correct positions");

  var sortedElements = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  var texts = Ember.$.map(sortedElements, function(el){ return Ember.$(el).text(); });
  deepEqual(texts, [
    'A:Item 3B:Item 3', 'A:Item 4B:Item 4',
    'A:Item 5B:Item 5'
  ], 'elements should be rendered in expected position');
});

test("elementWidth change", function(){
  var i,
      positionSorted,
      content = helper.generateContent(100),
      height = 200,
      width = 200,
      rowHeight = 50,
      elementWidth = 100,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    width: width,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    elementWidth: elementWidth
  });

  appendView();

  equal(view.$('.ember-list-item-view').length, 10, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 0   },
            { x:100, y: 0   },
            { x:0,   y: 50  },
            { x:100, y: 50  },
            { x:0 ,  y: 100 },
            { x:100, y: 100 },
            { x:0,   y: 150 },
            { x:100, y: 150 },
            { x:0,   y: 200 },
            { x:100, y: 200 }], "The rows are in the correct positions");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  for(i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i+1));
  }

  Ember.run(function() {
    view.set('width', 100);
  });

  equal(view.$('.ember-list-item-view').length, 5, "The correct number of rows were rendered");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  deepEqual(helper.itemPositions(view), [
            { x: 0, y: 0},
            { x: 0, y: 50},
            { x: 0, y: 100},
            { x: 0, y: 150},
            { x: 0, y: 200}
  ], "The rows are in the correct positions");

  for(i = 0; i < 5; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i+1));
  }

  Ember.run(function() {
    view.set('width', 200);
  });

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 10, "The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 0   },
            { x:100, y: 0   },
            { x:0,   y: 50  },
            { x:100, y: 50  },
            { x:0 ,  y: 100 },
            { x:100, y: 100 },
            { x:0,   y: 150 },
            { x:100, y: 150 },
            { x:0,   y: 200 },
            { x:100, y: 200 }], "The rows are in the correct positions");

  for(i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i+1));
  }
});

test("elementWidth change with scroll", function(){
  var i,
      positionSorted,
      content = helper.generateContent(100),
      height = 200,
      width = 200,
      rowHeight = 50,
      elementWidth = 100,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    width: width,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass,
    elementWidth: elementWidth
  });

  appendView();

  Ember.run(function(){
    view.scrollTo(1000);
  });

  equal(view.$('.ember-list-item-view').length, 10, "after scroll 1000 - The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 1000 },
            { x:100, y: 1000 },
            { x:0,   y: 1050 },
            { x:100, y: 1050 },
            { x:0 ,  y: 1100 },
            { x:100, y: 1100 },
            { x:0,   y: 1150 },
            { x:100, y: 1150 },
            { x:0,   y: 1200 },
            { x:100, y: 1200 }], "after scroll 1000 - The rows are in the correct positions");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  for (i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i + 41));
  }

  Ember.run(function() {
    view.set('width', 100);
  });

  equal(view.$('.ember-list-item-view').length, 5, " after width 100 -The correct number of rows were rendered");

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));

  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 2000 },
            { x:0,   y: 2050 },
            { x:0 ,  y: 2100 },
            { x:0,   y: 2150 },
            { x:0,   y: 2200 }], "after width 100 - The rows are in the correct positions");

  for(i = 0; i < 5; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i + 41));
  }

  Ember.run(function() {
    view.set('width', 200);
  });

  positionSorted = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  equal(view.$('.ember-list-item-view').length, 10, "after width 200 - The correct number of rows were rendered");
  deepEqual(helper.itemPositions(view), [
            { x:0,   y: 1000 },
            { x:100, y: 1000 },
            { x:0,   y: 1050 },
            { x:100, y: 1050 },
            { x:0 ,  y: 1100 },
            { x:100, y: 1100 },
            { x:0,   y: 1150 },
            { x:100, y: 1150 },
            { x:0,   y: 1200 },
            { x:100, y: 1200 }], "after width 200 - The rows are in the correct positions");

  for(i = 0; i < 10; i++) {
    equal(Ember.$(positionSorted[i]).text(), "Item " + (i + 41));
  }
});

test("A property of an item can be changed", function() {
  var content = helper.generateContent(100),
      height = 500,
      rowHeight = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("{{name}}")
      });

  view = Ember.VirtualListView.create({
    content: content,
    height: height,
    rowHeight: rowHeight,
    itemViewClass: itemViewClass
  });

  appendView();

  //Change name
  Ember.run(function() {
    content.set('0.name', 'First change');
  });

  equal(view.$('.ember-list-item-view:eq(0)').text(), "First change", "The item's name has been updated");

  //Scroll down, change name, and scroll back up
  Ember.run(function() {
    view.scrollTo(600);
  });

  Ember.run(function() {
    content.set('0.name', 'Second change');
  });

  Ember.run(function() {
    view.scrollTo(0);
  });

  equal(view.$('.ember-list-item-view:eq(0)').text(), "Second change", "The item's name has been updated");

});

test("The list view is wrapped in an extra div to support JS-emulated scrolling", function() {
  view = Ember.VirtualListView.create({
    content: Ember.A(),
    height: 100,
    rowHeight: 50
  });

  appendView();

  equal(view.$('.ember-list-container').length, 1, "expected a ember-list-container wrapper div");
  equal(view.$('.ember-list-container > .ember-list-item-view').length, 0, "expected no ember-list-items inside the wrapper div");
});

test("When destroyed, short-circuits syncChildViews", function() {
  expect(1);

  view = Ember.VirtualListView.create({
    content: helper.generateContent(4),
    height: 150,
    rowHeight: 50
  });

  appendView();

  Ember.run(function(){
    view.destroy();
  });

  Ember.run(function(){
    view._syncChildViews();
  });

  ok(true, 'made it!');
});

test("adding a column, when everything is already within viewport", function(){
  // start off with 2x3 grid visible and 4 elements
  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element, ?: no element
  //
  // x x  --|
  // x x    |- viewport
  // ? ?  --|
  var content = helper.generateContent(4),
      width = 100,
      height = 150,
      rowHeight = 50,
      elementWidth = 50,
      itemViewClass = Ember.ListItemView.extend({
        template: Ember.Handlebars.compile("A:{{name}}{{view view.NestedViewClass}}"),
        NestedViewClass: Ember.View.extend({
          tagName: 'span',
          template: Ember.Handlebars.compile("B:{{name}}")
        })
      });

  view = Ember.VirtualListView.create({
    content: content,
    width: width,
    height: height,
    rowHeight: rowHeight,
    elementWidth: elementWidth,
    itemViewClass: itemViewClass,
    scrollTop: 0
  });

  appendView();

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:    0 }, { x: 50, y:    0 },
            { x:  0, y:   50 }, { x: 50, y:   50 }
            ], "initial render: The rows are rendered in the correct positions");

  equal(view.$('.ember-list-item-view').length, 4, "initial render: The correct number of rows were rendered");

  // rapid dimension changes
  Ember.run(function() {
    view.set('width',  140);
  });

  Ember.run(function() {
    view.set('width',  150);
  });


  // x: visible, +: padding w/ element, 0: element not-drawn, o: padding w/o element
  //
  // x x x --|
  // x ? ?   |- viewport
  // ? ? ? --|

  equal(view.$('.ember-list-item-view').length, 4, "after width + height change: the correct number of rows were rendered");

  deepEqual(helper.itemPositions(view), [
            { x:  0, y:  0 }, { x: 50, y: 0 }, { x: 100, y: 0 },
            { x:  0, y: 50 }
            ], "after width + height change: The rows are in the correct positions");

  var sortedElements = helper.sortElementsByPosition(view.$('.ember-list-item-view'));
  var texts = Ember.$.map(sortedElements, function(el){ return Ember.$(el).text(); });

  deepEqual(texts, [
             'A:Item 1B:Item 1',
             'A:Item 2B:Item 2',
             'A:Item 3B:Item 3',
             'A:Item 4B:Item 4'
            ], 'after width + height change: elements should be rendered in expected position');
});

test("Creating a VirtualListView without height and rowHeight properties should throw an exception", function() {
  throws(function() {
    view = Ember.VirtualListView.create({
      content: helper.generateContent(4)
    });

    appendView();
  },
  /Invalid rowHeight: `undefined`/);
});

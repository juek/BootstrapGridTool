/**
 * JS/jQuery for Typesetter CMS plugin Bootstrap Grid Tool
 * Author: J. Krausz
 * Version 0.8a
 * 
 */

// console.log('BootstrapGridTool evaluated');

$gp.bsgt = {

  debug                 : false,

  default_col_count     : 12, // Bootstrap default, if auto detection fails
  default_columns       : {
                            bootstrap3 : { xs : 12, md : 6 },
                            bootstrap4 : { xs : 12, lg : 6 }
                          },

  default_offsets       : {
                            bootstrap3 : {},
                            bootstrap4 : {}
                          },

  is_active             : false,

  current_section       : false,
  current_classes       : {
                            offsets : {},
                            columns : {},
                            others : []
                          },

  messages              : {
                            inheritance_purge : {
                              show : false,
                              type : 'info',
                              text : 'Due to inheritance, these unnecessary classes have been removed: '
                            },
                            col_not_in_row : {
                              show : true,
                              type : 'warning',
                              text : 'Columns must be inside a .row wrapper'
                            },
                            col_is_row : {
                              show : true,
                              type : 'warning',
                              text : 'A column should not be a row at the same time'
                            },
                            col_is_container : {
                              show : true,
                              type : 'warning',
                              text : 'A column must not be a container at the same time'
                            },
                            multi_class_attrs : { 
                              show : true,
                              type : 'warning',
                              text : 'Multiple <em>class</em> attributes have been merged'
                            },
                            offsets_without_columns : { 
                              show : true,
                              type : 'warning',
                              text : 'Using offset classes without columns is not recommended'
                            },
                            col_range_exceeded : { 
                              show : true,
                              type : 'warning',
                              text : 'Inherited offset breaks total column range. These column widths have been adjusted: '
                            }
                          },

  inheritance           : { offsets : {}, columns : {} },

  bootstrap             : { version : false },  // wil be detected via init()

  ui                    : {
                            fa_icons      : {},
                            widget_width  : null, // wil be set via init()
                            col_width     : null  // wil be set via init()
                          },

  init                  : function(){},
  create                : function(){},
  reset                 : function(){}

};



$gp.bsgt.reset = function(){
  $gp.bsgt.is_active        = false;
  $gp.bsgt.current_section  = false,
  $gp.bsgt.current_classes  = { offsets : {}, columns : {}, others : {} };
  $gp.bsgt.inheritance      = { offsets : {}, columns : {} };
}




$gp.bsgt.init = function(){

  $gp.bsgt.detectBootstrap();
  if( $gp.bsgt.bootstrap.version < 3 ){
    return false;
  }

  $gp.bsgt.getBreakpoints();
  $gp.bsgt.countCols();
  $gp.bsgt.appendBreakpointDetector();
  $gp.bsgt.showBreakpointInfo();

  $(document).on('section_sorting:loaded section_options:closed SectionAdded SectionRemoved', function(e){
    $gp.bsgt.debug && console.log('checkSectionStructure() triggered by event: ' + e.type );
    $gp.bsgt.checkSectionStructure();
  });

  $(document).on('SectionAdded SectionRemoved', function(e){
    $gp.bsgt.debug && console.log('checkSectionStructure() triggered by event: ' + e.type );
    setTimeout($gp.bsgt.checkSectionStructure, 100);
  });

  $(document).on('SectionSorted', '#gpx_content .GPAREA', function(e){
    $gp.bsgt.debug && console.log('Section was Added/Sorted -> calling $gp.bsgt.checkSectionStructure()');
    $gp.bsgt.checkSectionStructure(e.target);
  });


  // bind create UI when Section Attributes dialog was loaded
  $(document).on('section_options:loaded', function(e){
    $gp.bsgt.debug && console.log('Section Attributes dialog loaded -> calling $gp.bsgt.create()');
    $gp.bsgt.create();
  }); 
  $(document).on('click', '#section_attributes_form .gpsubmit, #section_attributes_form .gpcancel', function(e){
    $gp.bsgt.debug && console.log('Section Attributes dialog closed -> calling $gp.bsgt.reset()');
    $gp.bsgt.reset();
  });

};



$gp.bsgt.activate = function(){
  $gp.bsgt.initRangeSliders();
  if( !$gp.bsgt.is_active ){
    $gp.bsgt.setDefaultClasses();
    $gp.bsgt.is_active = true;
  }
  $gp.bsgt.checkClassesInputRow(true);
  $gp.bsgt.updateClassesInput();
  $gp.bsgt.updateUI();
};



$gp.bsgt.checkSectionStructure = function(target){
  if( typeof(target) == 'undefined' ){
    var $check_elements = $('#gpx_content .GPAREA');
  }else{
   var $check_elements = $(target);
  }

  $gp.bsgt.debug && console.log('$gp.bsgt.checkSectionStructure() called for ', $check_elements);

  $check_elements.each( function(){  // [class*="col-"]
    var $this = $(this);
    var area_id = $gp.AreaId($this);
    var $li = $('#section_sorting li[data-gp-area-id="' + area_id + '"]');
    $li.find('> div .section_label_wrap > i').remove();
    $gp.bsgt.debug && console.log('$li = ', $li);
    $label_wrap = $li.find('> div .section_label_wrap');

    var classNamesArray = this.className.split(/\s+/);
    $.each(classNamesArray, function(i, v){
      if( v == 'col' || v.indexOf('col-') == 0 ){
        $label_wrap
          .prepend('<i class="bootstrap-class-icon bootstrap-icon-column" title="Bootstrap grid column"></i>');
        if( !$this.parent().hasClass('row') ){
          $gp.bsgt.debug && console.log('Section Warning: ', $gp.bsgt.messages.col_not_in_row.text);
          $label_wrap
            .prepend('<i class="warn-col-not-in-row fa fa-exclamation-triangle" title="' 
              + $gp.bsgt.messages.col_not_in_row.text + '">');
        }
        return false;
      }
    });

    if( $this.hasClass('row') ){
      $label_wrap
        .prepend('<i class="bootstrap-class-icon bootstrap-icon-row" title="Bootstrap grid row"></i>');
    }

    if( $this.hasClass('container') ){
      $label_wrap
        .prepend('<i class="bootstrap-class-icon bootstrap-icon-container" title="Bootstrap container"></i>');
    }
  
  });
};



$gp.bsgt.getClassesFromInput = function(){
  var classes_input = $('form#section_attributes_form input.attr_name[value="class"]')
    .closest('tr').find('.attr_value');

  var classes = classes_input.length ? $.trim(classes_input.val()) : false;

  if( !classes ){
    return;
  }

  classes = classes.replace(/\s\s+/g, ' ').split(' ');

  switch( $gp.bsgt.bootstrap.version ){
    case 3:
      var regexp_column = new RegExp('^col-(xs|sm|md|lg)-\\d+$');
      var regexp_offset = new RegExp('^col-(xs|sm|md|lg)-offset-\\d+$');
      break;

    case 4:
    default: // BS > 4
      var regexp_column = new RegExp('^col-((sm|md|lg|xl)-)?\\d+$');
      var regexp_offset = new RegExp('^offset-((sm|md|lg|xl)-)?\\d+$');
      break;
  }

  var separated_classes = {
    columns : [],
    offsets : [],
    others : []
  };
  
  $.each(classes, function(i, v){
    if( regexp_offset.test(v) ){
      separated_classes.offsets.push(v);
    }else if( regexp_column.test(v) ){
      separated_classes.columns.push(v);
      $gp.bsgt.is_active = true;
    }else{
      separated_classes.others.push(v);
    }
  });

  $gp.bsgt.debug && console.log('separated_classes = ', separated_classes);

  var breakpoint_separated_classes = {
    columns : {},
    offsets : {},
    others : separated_classes.others
  };

  $.each($gp.bsgt.bootstrap.breakpoints, function(bpi, bpv){
    if( $gp.bsgt.bootstrap.version > 3 && bpi == 'xs' ){
      var regexp_bp = new RegExp('^(col|offset)-\\d{1,2}$');
    }else{
      var regexp_bp = new RegExp('^(col|offset)-' + bpi + '-\\d{1,2}$');
    }
    // breakpoint_separated_classes.offsets[bpi] = [];
    $.each(separated_classes.offsets, function(oi, ov){
      if( regexp_bp.test(ov) ){
        breakpoint_separated_classes.offsets[bpi] = ov;
      }
    });
    // breakpoint_separated_classes.columns[bpi] = [];
    $.each(separated_classes.columns, function(ci, cv){
      if( regexp_bp.test(cv) ){
        breakpoint_separated_classes.columns[bpi] = cv;
      }
    });
  });

  $gp.bsgt.current_classes = breakpoint_separated_classes;
  $gp.bsgt.debug && console.log('$gp.bsgt.current_classes = ' , $gp.bsgt.current_classes);
};



$gp.bsgt.updateClassesInput = function(){

  $gp.bsgt.checkClassesInputRow();

  var $classes_name_input  = $('form#section_attributes_form input.attr_name[value="class"]');
  var $classes_value_input = $classes_name_input.closest('tr').find('.attr_value');
  
  //$(['others', 'columns', 'offsets'], function(i, bewkpoints){});
  var class_names = [];
  $.each($gp.bsgt.current_classes, function(classtype, classdata){
    if( classtype == 'others' ){
      class_names.push(classdata.join(' '));
    }else{
      $.each(classdata, function(breakpoint, class_name){
        class_names.push(class_name);
      });
    }
  });
  $classes_value_input.val(class_names.join(' '));

};



$gp.bsgt.countCols = function(){
  var html =  '<div class="bsgt-detect-columns"><div class="row">';
  for( var col=1; col<=36; col++ ){
    html  +=    '<div data-col="' + col 
      + '" class="bsgt-testcol col-' + col 
      + ' col-xs-' + col + '"></div>';
  }
  html    +=  '</div></div>';
  $detect_cols = $(html).appendTo('body');

  var parentwidth = $detect_cols.width();
  $gp.bsgt.bootstrap.columns = $gp.bsgt.default_col_count;

  $detect_cols.find('.bsgt-testcol').each( function(){
    $gp.bsgt.debug && console.log($(this).width() + ' == ' + parentwidth);
    if( $(this).width() == parentwidth ){
      $gp.bsgt.bootstrap.columns = $(this).attr('data-col');
      $gp.bsgt.debug && console.log($gp.bsgt.bootstrap.columns + ' Bootstrap columns detected');
      return false;
    }
  });
  $detect_cols.remove();
};



$gp.bsgt.breakpoint = function(){
  var breakpoint = 'undefined';
  $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){
    if( $('.bsgt-breakpoint-' + breakpoint).is(':visible') ){
      breakpoint = breakpoint;
    }
  });
  return breakpoint;
};


// generate possible col classes
$gp.bsgt.getColClasses = function(){

  $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){

    $gp.bsgt.bootstrap.breakpoints[breakpoint]['cols'] = [];
    $gp.bsgt.bootstrap.breakpoints[breakpoint]['offsets'] = [];

    var prefix = ($gp.bsgt.bootstrap.version > 3 && breakpoint == 'xs') ? '' : breakpoint + '-';

    var c = 1;
    while( c <= $gp.bsgt.bootstrap.columns ){
      $gp.bsgt.bootstrap.breakpoints[breakpoint]['cols'].push('col-' + prefix + c);
      c++;
    }

    var o = 0;
    while( o < $gp.bsgt.bootstrap.columns ){
      $gp.bsgt.bootstrap.breakpoints[breakpoint]['offsets'].push('offset-' + prefix + o);
      o++;
    }
  });
  $gp.bsgt.debug && console.log('$gp.bsgt.bootstrap.breakpoints = ', $gp.bsgt.bootstrap.breakpoints);
};



$gp.bsgt.create = function(){
  $gp.bsgt.debug && console.log('BootstrapGridTool creating UI');

  $gp.bsgt.getColClasses();

  switch( $gp.bsgt.bootstrap.version ){
    case 3:
      var fa_icons = {
        xs : 'fa-mobile',
        sm : 'fa-tablet',
        md : 'fa-laptop',
        lg : 'fa-desktop'
      };
      break;

    case 4:
    default: // BS > 4
      var fa_icons = {
        xs : 'fa-mobile',
        sm : 'fa-mobile fa-rotate-90',
        md : 'fa-tablet',
        lg : 'fa-laptop',
        xl : 'fa-desktop',
      };
      break;
  }
  $gp.bsgt.ui.fa_icons = fa_icons;

  var grid_html = '<div class="bsgt-grid">';
  for( var col = 1; col <= $gp.bsgt.bootstrap.columns; col++ ){
    grid_html += '<div></div>'; //  title="' + col + '"
  }
  //var gridlines = new Array($gp.bsgt.column_count + 1);
  //grid_html += gridlines.join('<div></div>');
  grid_html += '</div>';

  var html = '<div id="bootstrap_grid_tool">';
  html += '<table class="bordered full_width">';
  html += '<thead><tr>';
  html += '<th colspan="' + ( $gp.bsgt.bootstrap.version < 4 ? '4' : '5' ) + '">';
  html +=   '<div class="bsgt-theading">';
  html +=     '<div class="bsgt-title">Bootstrap Grid Column</div>';
  html +=     '<div class="bsgt-messages"></div>';
  html +=     '<div class="bsgt-toggle"><a class="bsgt-btn bsgt-make-column">make column</a></div>';
  html +=   '</div>';
  html += '</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  html += '<tr>';
  $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){
    html += '<td class="bsgt-breakpoint-' + breakpoint + '" data-breakpoint="' + breakpoint + '">';
    html +=   '<div class="bsgt-widget">';
    html +=     '<div class="bsgt-widget-caption" title="width ' + data.width + ' and greater">'; //  bsgt-bg-' + breakpoint + '
    html +=       '<i class="fa ' + fa_icons[breakpoint] + '"></i> <strong>' + breakpoint + '</strong>';
    html +=       '<span class="bsgt-breakpoint-width-info">' + data.width + '</span>';
    html +=     '</div>';
    html +=     '<div class="bsgt-widget-grid-wrapper">';
    html +=       grid_html;
    html +=       '<div class="bsgt-range bsgt-range-' + breakpoint + '" data-breakpoint="' + breakpoint + '">';
    html +=         '<div title="offset" class="bsgt-range-handle-start ui-resizable-handle ui-resizable-w">';
    html +=         '</div>';
    html +=         '<div title="width" class="bsgt-range-handle-end ui-resizable-handle ui-resizable-e">';
    html +=         '</div>';
    html +=       '</div>';
    html +=     '</div>';
    html +=     '<div class="bsgt-widget-column-class bsgt-widget-column-class-' + breakpoint + '">';
    html +=       '<input type="text" value="n/a" readonly="readonly" />';
    html +=       '<a class="bsgt-unset-button" data-breakpoint="' + breakpoint + '" data-classtype="columns" title="unset">&times;</a>';
    html +=     '</div>';
    html +=     '<div class="bsgt-widget-offset-class bsgt-widget-offset-class-' + breakpoint + '">';
    html +=       '<input value="n/a" readonly="readonly" />';
    html +=       '<a class="bsgt-unset-button" data-breakpoint="' + breakpoint + '" data-classtype="offsets" title="unset">&times;</a>';
    html +=     '</div>';
    html +=   '</div>';
    html += '</td>';
  });
  html += '</tr>';
  html += '</tbody>';
  html += '</table>';

  var $html = $(html);
  $html.insertBefore('#gp_avail_classes');

  $gp.bsgt.checkRowContext();
  $gp.bsgt.getClassesFromInput();

  $gp.bsgt.ui.tbody = $html.find(' > table tbody');
  $gp.bsgt.ui.range_sliders = $html.find('.bsgt-range');

  if( $gp.bsgt.is_active ){
    $gp.bsgt.activate();
  }else{
    $html.find('.bsgt-make-column')
      .show()
      .one('click', $gp.bsgt.activate);
  }
};



$gp.bsgt.initRangeSliders = function(){
    $gp.bsgt.ui.tbody.css('display', 'table-row-group');

    $gp.bsgt.ui.col_width = Math.floor($gp.bsgt.ui.range_sliders.first().width() / $gp.bsgt.bootstrap.columns);
    $gp.bsgt.ui.widget_width = $gp.bsgt.ui.col_width * $gp.bsgt.bootstrap.columns;

    // make widget pixel-accurate
    $gp.bsgt.ui.range_sliders.each(function(){
      $range_slider = $(this);
      $range_slider.closest('.bsgt-widget').width($gp.bsgt.ui.widget_width);
      $range_slider.data('breakpoint', $range_slider.attr('data-breakpoint'));
    });

    $gp.bsgt.ui.range_sliders.resizable({
      containment : 'parent',
      minWidth    : $gp.bsgt.ui.col_width,
      grid        : [$gp.bsgt.ui.col_width, 1],
      handles     : { 'w' : '.bsgt-range-handle-start', 'e' : '.bsgt-range-handle-end' },
      stop        : function(event, ui){
                      var breakpoint = $(ui.element).data('breakpoint');
                      var left = ui.position.left;
                      var width = ui.size.width;
                      var offset = left / $gp.bsgt.ui.col_width;
                      var column = width / $gp.bsgt.ui.col_width; 
                      /* $gp.bsgt.debug && console.log(
                        'resizable -> stop()'
                        + ' | breakpoint = ' + breakpoint
                        + ' | left = ' + left
                        + ' | width = ' + width
                        + ' | offset = ' + offset
                        + ' | column = ' + column
                        + ' | $gp.bsgt.ui.col_width = ' + $gp.bsgt.ui.col_width
                      ); */
                      var classes_map = { offsets : {}, columns : {} };
                      classes_map.offsets[breakpoint] = offset;
                      classes_map.columns[breakpoint] = column;
                      $gp.bsgt.updateClasses(classes_map);
                      $gp.bsgt.updateClassesInput();
                      $gp.bsgt.updateUI();
                    }
    });
    var $unset_buttons = $gp.bsgt.ui.tbody.find('a.bsgt-unset-button');
    $unset_buttons.on('click', function(){
      var classtype = $(this).attr('data-classtype');
      var breakpoint = $(this).attr('data-breakpoint');
      var classes_map = {};
      classes_map[classtype] = {};
      classes_map[classtype][breakpoint] = '';
      $gp.bsgt.debug && console.log('classes_map constructed using classtype:' + classtype + ' and breakpoint:' +breakpoint);
      $gp.bsgt.updateClasses(classes_map);
      $gp.bsgt.updateClassesInput();
      $gp.bsgt.updateUI();
    });
};



$gp.bsgt.setDefaultClasses = function(){

  var default_offsets = $gp.bsgt.bootstrap.version < 4
    ? $gp.bsgt.default_offsets.bootstrap3
    : $gp.bsgt.default_offsets.bootstrap4;

  var default_columns = $gp.bsgt.bootstrap.version < 4
    ? $gp.bsgt.default_columns.bootstrap3
    : $gp.bsgt.default_columns.bootstrap4;
  
  var classes_map = {
    offsets : default_offsets,
    columns : default_columns
  };
  $gp.bsgt.updateClasses(classes_map);

};




/**
 * merges an [optional] passed map of classes into $gp.bsgt.current_classes
 * cares for 'breakpoint upwards inheritance'
 * by removing redundancies
 */
$gp.bsgt.updateClasses = function(classes_map){
  $gp.bsgt.debug && console.log('$gp.bsgt.updateClasses() called with arguments = ', arguments);

  // create empty object if there is no classes_map argument passed
  if( typeof(classes_map) != 'object' ){
    var classes_map = {};
  }

  // check for offsets but no columns defined
  var defined_offsets = Object.keys($gp.bsgt.current_classes.offsets).length;
  var defined_columns = Object.keys($gp.bsgt.current_classes.columns).length;
  if( defined_offsets && !defined_columns ){
    $gp.bsgt.showMessage(
      $gp.bsgt.messages.offsets_without_columns.text,
      $gp.bsgt.messages.offsets_without_columns.type
    );
  }


  // remove offset-0 in the xs breakpoint (makes no sense at all)
  var offset_xs_0 = 'offsets' in classes_map && 'xs' in classes_map.offsets
    && classes_map.offsets.xs === 0;
  if( offset_xs_0 ){
    // delete classes_map.offsets.xs;
    delete $gp.bsgt.current_classes.offsets.xs;
  }
  // same with current classes
  var offset_xs_0 = 'xs' in $gp.bsgt.current_classes.offsets 
    && $gp.bsgt.class2int($gp.bsgt.current_classes.offsets.xs) === 0;
  if( offset_xs_0 ){
    delete $gp.bsgt.current_classes.offsets.xs;
  }


  // Bootstrap (3+) is mobile-first, so columns 'inherit' properties from smaller breakpoints, starting at xs
  var inheritance = { offset : 0, column : false };
  var inheritance_purge_messages = [];

  $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){

    $gp.bsgt.debug && console.log('updateClasses() : breakpoint = ' + breakpoint);

    $.each(['offset', 'column'], function(i, type){

      var types =  type + 's';

      if( types in classes_map && breakpoint in classes_map[types] ){
        // new value passed via classes_map
        var new_value = $gp.bsgt.class2int(classes_map[types][breakpoint]); 
        if( isNaN(new_value) || new_value === inheritance[type] ){
          // passed '', false, or null (for unset) or invalid classname
          // OR passed value equals to inherited value
          // so kill it
          $gp.bsgt.debug && console.log(
            'updateClasses() : new_value = ' + new_value
            + ' -> deleting $gp.bsgt.current_classes.' + types + '.' + breakpoint
          );
          if( breakpoint != 'xs' && !isNaN(new_value) ){
            inheritance_purge_messages.push($gp.bsgt.current_classes[types][breakpoint]);
          }
          delete $gp.bsgt.current_classes[types][breakpoint];
        }else{
          var class_name = $gp.bsgt.getContextClassName(type, breakpoint, new_value);
          $gp.bsgt.current_classes[types][breakpoint] = class_name;
          inheritance[type] = new_value;
        }
      }else if( types in $gp.bsgt.current_classes && breakpoint in $gp.bsgt.current_classes[types]){
        // value was already set, check for new inheritance
        var existing_value = $gp.bsgt.class2int($gp.bsgt.current_classes[types][breakpoint]);
        $gp.bsgt.debug && console.log(
          'updateClasses() : existing ' + type 
            + ' class for breakpoint ' + breakpoint 
            + ' = ' + $gp.bsgt.current_classes[types][breakpoint] // existing_value
          );
        if( existing_value == inheritance[type] ){
          $gp.bsgt.debug && console.log(
            'updateClasses() : existing_value = ' + existing_value
            + ' | inheritance[' + type + '] = ' + inheritance[type]
            + ' -> deleting $gp.bsgt.current_classes.' + types + '.' + breakpoint
          );
          // delete existing value because it matches inheritance
          if( breakpoint != 'xs' ){
            inheritance_purge_messages.push($gp.bsgt.current_classes[types][breakpoint]);
          }
          delete $gp.bsgt.current_classes[types][breakpoint];
        }else{
          inheritance[type] = existing_value;
        }
      }

      if( breakpoint != 'xs' ){
        $gp.bsgt.inheritance[types][breakpoint] = inheritance[type];
      }

    });

  });

  // show purge message
  if( $gp.bsgt.messages.inheritance_purge.show && inheritance_purge_messages.length ){
    $gp.bsgt.debug && console.log('updateClasses() : inheritance_purge_messages = ', inheritance_purge_messages);
    $gp.bsgt.showMessage(
      $gp.bsgt.messages.inheritance_purge.text
      + ' ' + inheritance_purge_messages.join(', '),
      $gp.bsgt.messages.inheritance_purge.type
    );
  }

  // check for offset + col > max cols
  var new_column_inheritance = false;
  var col_range_messages = [];

  $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){
    if( !('columns' in $gp.bsgt.current_classes && breakpoint in $gp.bsgt.current_classes.columns) && new_column_inheritance ){
      $gp.bsgt.inheritance.columns[breakpoint] = new_column_inheritance; 
    }
    
    var offset = $gp.bsgt.class2int($gp.bsgt.current_classes.offsets[breakpoint])
      || $gp.bsgt.inheritance.offsets[breakpoint]
      || 0;
    var column = $gp.bsgt.class2int($gp.bsgt.current_classes.columns[breakpoint])
      || $gp.bsgt.inheritance.columns[breakpoint]
      || 1;

    if( column + offset > $gp.bsgt.bootstrap.columns ){
      $gp.bsgt.debug && console.log('fix inherited width: column = ' , column + ' | offset = ' , offset);
      var new_width = $gp.bsgt.bootstrap.columns - offset;
      var bad_class = $gp.bsgt.current_classes.columns[breakpoint];
      $gp.bsgt.current_classes.columns[breakpoint] = $gp.bsgt.getContextClassName('column', breakpoint, new_width);
      new_column_inheritance = new_width;
      col_range_messages.push(
        bad_class + '&rarr;'
        + $gp.bsgt.current_classes.columns[breakpoint]
      );
    }
  });

  if( col_range_messages.length ){
    $gp.bsgt.showMessage(
      $gp.bsgt.messages.col_range_exceeded.text
      + ' (' + col_range_messages.join(', ') + ')',
      $gp.bsgt.messages.col_range_exceeded.type
    );
  }

};



$gp.bsgt.getContextClassName = function(type, breakpoint, size){
  var class_name = 'error';
  var breakpoint_infix  = 
    ($gp.bsgt.bootstrap.version > 3 && breakpoint == 'xs')
      ? '' 
      : breakpoint + '-';
  switch( type ){
    case 'offset':
      class_name = ($gp.bsgt.bootstrap.version > 3)
        ? 'offset-' + breakpoint_infix + size
        : 'col-' + breakpoint + '-offset-' + size;
      break;
    case 'column':
    case 'col':
      class_name = 'col-' + breakpoint_infix + size;
      break;
  }
  return class_name;
};





$gp.bsgt.updateUI = function(){

  var column = { current : 12, breakpoint : 'xs' };
  var offset = { current : 0,  breakpoint : 'xs' };

  $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){
    $gp.bsgt.debug && console.log('updateUI() : breakpoint = ' + breakpoint);
    
    var $range_slider       = $('.bsgt-range-' + breakpoint);
    var $offset_input       = $('.bsgt-widget-offset-class-' + breakpoint + ' > input');
    var $offset_unset_btn   = $('.bsgt-widget-offset-class-' + breakpoint + ' > a.bsgt-unset-button');
    var $column_input       = $('.bsgt-widget-column-class-' + breakpoint + ' > input');
    var $column_unset_btn   = $('.bsgt-widget-column-class-' + breakpoint + ' > a.bsgt-unset-button');
    
    if( !$range_slider.length ){
      $gp.bsgt.debug && console.log('Error: $(".bsgt-range-' + breakpoint + '") does not exist');
      return false;
    }

    if( 'offsets' in $gp.bsgt.current_classes && breakpoint in $gp.bsgt.current_classes.offsets ){
      offset.current = $gp.bsgt.class2int($gp.bsgt.current_classes.offsets[breakpoint]);
      // var class_name = $gp.bsgt.getContextClassName('offset', breakpoint, offset.current);
      // $offset_input.val(class_name);
      $offset_input.val($gp.bsgt.current_classes.offsets[breakpoint]);
      $offset_unset_btn.show();
    }else{
      var input_val = ('offsets' in $gp.bsgt.inheritance && breakpoint in $gp.bsgt.inheritance.offsets)
        ? '\u21d2 inherited'
        : '';
      $offset_input.val(input_val);
      $offset_unset_btn.hide();
    }

    if( 'columns' in $gp.bsgt.current_classes && breakpoint in $gp.bsgt.current_classes.columns ){
      column.current = $gp.bsgt.class2int($gp.bsgt.current_classes.columns[breakpoint]);
      // var class_name = $gp.bsgt.getContextClassName('column', breakpoint, column.current);
      // $column_input.val(class_name);
      $column_input.val($gp.bsgt.current_classes.columns[breakpoint]);
      $column_unset_btn.show();
    }else{
      var input_val = ('columns' in $gp.bsgt.inheritance && breakpoint in $gp.bsgt.inheritance.columns)
        ? '\u21d2 inherited'
        : '';
      $column_input.val(input_val);
      $column_unset_btn.hide();
    }

    var left  = offset.current * $gp.bsgt.ui.col_width;
    var width = column.current * $gp.bsgt.ui.col_width;

    $range_slider.css({
      'left'  : left + 'px', 
      'width' : width + 'px'
    });

  });

};



$gp.bsgt.showMessage = function(msg, msg_type, sticky){
  if( typeof(msg) == 'undefined' ){
    $gp.bsgt.debug && console.log('showMessage error: 1st argument (msg) is not defined');
    return;
  }
  if( typeof(sticky) == 'undefined' ){
    var sticky = false;
  }
  if( typeof(msg_type) == 'undefined' ){
    var msg_type = 'info';
  }
  var msg_html = '<div title="' + msg_type + '" class="bsgt-msg bsgt-msg-' + msg_type + '">'
    + (!sticky ? '<span title="dismiss" class="bsgt-dismiss-msg"></span>' : '')
    + '<span class="bsgt-msg-text">' + msg + '</span></div>';

  var $new_msg = $(msg_html);

  $new_msg.prependTo('.bsgt-messages');
  $new_msg
    .find('.bsgt-dismiss-msg')
      .on('click', function(){
        $(this).closest('.bsgt-msg').fadeOut(300, function(){
          $(this).remove();
        });
      });
};



/* #################################### */
/* ######## HELPER FUNCTIONS ########## */
/* #################################### */


$gp.bsgt.class2int = function(classname){
  if( typeof(classname) == 'undefined' || classname === '' || classname === false || classname === null ){
    var return_val = NaN;
  }else{
    var return_val = parseInt( (classname.toString()).replace(/[^0-9]/g, ''));
  }
  $gp.bsgt.debug && console.log('class2int() called with arguments ' , arguments, ' -> returns: ', return_val);
  return return_val;
};



$gp.bsgt.checkRowContext = function(){
  $gp.bsgt.current_section = gp_editor.GetArea($('#section_attributes_form'));
  if( $gp.bsgt.messages.col_not_in_row.show && !$gp.bsgt.current_section.parent().is('.row') ){
    $gp.bsgt.showMessage($gp.bsgt.messages.col_not_in_row.text, $gp.bsgt.messages.col_not_in_row.type);
  }
};



$gp.bsgt.checkClassesInputRow = function(rebind_events){
  var $classes_row = $('form#section_attributes_form input.attr_name[value="class"]').closest("tr");

  if( $classes_row.length == 1 ){
    $gp.bsgt.ui.classes_input = $classes_row.find('.attr_value');
    if( typeof(rebind_events) != 'unfedined' && rebind_events ){
      $gp.bsgt.ui.classes_input
        .off('change')
        .on('change', function(){
          $gp.bsgt.getClassesFromInput();
          $gp.bsgt.updateClasses();
          $gp.bsgt.updateUI();
          $gp.bsgt.updateClassesInput();
        });
    }
    return;
  }

  if( $classes_row.length == 0 ){
    var html =  '<tr><td class="bsgt-new-classes-row">';
    html    +=    '<input class="gpinput attr_name" value="class" size="8" />';
    html    +=  '</td><td>';
    // html    +=    '<input class="gpinput attr_value" value="" size="40" />';
    html    +=    '<textarea rows="1" class="gptextarea attr_value"></textarea>';
    html    +=  '</td></tr>';
    var $new_classes_row = $(html);
    $new_classes_row.appendTo('form#section_attributes_form tbody');

    $gp.bsgt.ui.classes_input = $new_classes_row.find('.attr_value');
    $gp.bsgt.ui.classes_input
      .on('change', function(){
        $gp.bsgt.getClassesFromInput();
        $gp.bsgt.updateClasses();
        $gp.bsgt.updateUI();
        $gp.bsgt.updateClassesInput();
      });

    return;
  }
  
  if( $classes_row.length > 1 ){
    $gp.bsgt.debug && console.log('checkClassesInputRow() : multiple classes rows found, fixing it');
    $gp.bsgt.showMessage($gp.bsgt.multi_class_attrs.text, $gp.bsgt.multi_class_attrs.type);

    var merged_classes = '';
    $classes_row.each(function(){
      merged_classes += $(this).find('.attr_value').val();
    });
    $classes_row.not(":eq(0)").remove();
    $gp.bsgt.ui.classes_input = $classes_row.find('.attr_value');
    $gp.bsgt.ui.classes_input
      .off('change')
      .on('change', function(){
        $gp.bsgt.getClassesFromInput();
        $gp.bsgt.updateClasses();
        $gp.bsgt.updateUI();
        $gp.bsgt.updateClassesInput();
      });
    return;
  }

};



$gp.bsgt.detectBootstrap = function(){
  var html  =  '<div class="bsgt-detect-bootstrap">';
  html     +=    '<div class="bsgt-is-bootstrap-3 visible-xs visible-sm visible-md visible-lg"></div>';
  html     +=    '<div class="bsgt-is-bootstrap-4 d-block"></div>';
  html     +=  '</div>';
  var $html = $(html).appendTo('body');
  if( $html.find('.bsgt-is-bootstrap-3').is(':visible') ){
    $gp.bsgt.bootstrap.version = 3;
  }
  if( $html.find('.bsgt-is-bootstrap-4').is(':visible') ){
    $gp.bsgt.bootstrap.version = 4;
  }
  $html.remove();
  $gp.bsgt.debug && console.log(
    'Bootstrap ' 
    + ($gp.bsgt.bootstrap.version ? 'version ' + $gp.bsgt.bootstrap.version : 'not' ) 
    + ' detected'
  );
};



$gp.bsgt.showBreakpointInfo = function(){
  var html =  '<div class="bsgt-breakpoint-info-widget">';

  
  var bs4_visible_on = {
    'xs' : 'd-block d-sm-none',
    'sm' : 'd-none d-sm-block d-md-none',
    'md' : 'd-none d-md-block d-lg-none',
    'lg' : 'd-none d-lg-block d-xl-none',
    'xl' : 'd-none d-xl-block'
  };

  $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){
    html += '<div class="bsgt-breakpoint-info bsgt-breakpoint-info-' + breakpoint + ' '
               + 'visible-' + breakpoint + ' ' // Bootsrap 3
               + bs4_visible_on[breakpoint] // Bootsrap 4
               + '">';
    html +=   '<div></div>';
    html +=   '<span class="bsgt-breakpoint-info-name">' + breakpoint + '</span>';
    html +=   '<span class="bsgt-breakpoint-info-width">' + data.width + '</span>';
    html += '</div>';
  });

  html +=    '<div class="bsgt-breakpoint-info-viewport-width"></div>';
  html +=    '<div class="bsgt-breakpoint-info-toggle" title="toggle widget"></div>';
  html +=  '</div>';

  $widget = $(html);

  $widget.find('.bsgt-breakpoint-info-toggle').on('click', function(){
    var $this = $(this).closest('.bsgt-breakpoint-info-widget');
    $this.toggleClass('bsgt-breakpoint-info-widget-hidden');
    gpui.cky = $this.hasClass('bsgt-breakpoint-info-widget-hidden') ? -1 : 0;
    $gp.SaveGPUI();
  });

  // let's abuse the obsolete gpui.cky value to store the widget toggle state ;o)
  (gpui.cky > 0) && (gpui.cky = 0);

  $widget
    .toggleClass('bsgt-breakpoint-info-widget-hidden', !!gpui.cky) // !! is not-not, easiest way evaluating a variable to become a true boolean
    .appendTo('body');

  $('.bsgt-breakpoint-info-viewport-width')
      .text( $(window).innerWidth() + 'px');

  $(window).on('resize', function(){
    $('.bsgt-breakpoint-info-viewport-width')
      .text( $(window).innerWidth() + 'px');
  });

};



$gp.bsgt.appendBreakpointDetector = function(){
  var html =  '<div class="bsgt-detect-breakpoint">';
  html    +=    '<div class="bsgt-breakpoint-xs visible-xs d-block"></div>';
  html    +=    '<div class="bsgt-breakpoint-sm visible-sm d-sm-block"></div>';
  html    +=    '<div class="bsgt-breakpoint-md visible-md d-md-block"></div>';
  html    +=    '<div class="bsgt-breakpoint-lg visible-lg d-lg-block"></div>';
  html    +=    '<div class="bsgt-breakpoint-xl d-xl-block"></div>';
  html    +=  '</div>';
  $(html).appendTo('body');
};



$gp.bsgt.getBreakpoints = function(){
  switch( $gp.bsgt.bootstrap.version ){
    case 3:
      // Up to Bootstrap 3 there is no (cheap) way to read
      // breakpoint widths from typically generated CSS,
      // therefore we use hardcoded defaults
      $gp.bsgt.bootstrap.breakpoints = {
        'xs'  : { width : '0' },
        'sm'  : { width : '768px' },
        'md'  : { width : '992px' },
        'lg'  : { width : '1200px' }
      };
      break;

    case 4:
    default: // (presumed for Bootstrap 5+)
      $gp.bsgt.bootstrap.breakpoints = {
        'xs'  : { width : '0' },
        'sm'  : { width : '576px' },
        'md'  : { width : '768px' },
        'lg'  : { width : '992px' },
        'xl'  : { width : '1200px' }
      };
      // As of Bootstrap 4, breakpoint widths are usually defined as --breakpoint-* CSS variables,
      // hence we can read them from the document style
      // Dektop web browser support: Edge 18+, Firefox 31+, Chrome 49+, Safari 9.1+, Opera 31+
      // see https://caniuse.com/#feat=css-variables for others
      var css_var_support = window.CSS && CSS.supports('width', 'var(--dummyvar)');
      if( !css_var_support ){
       return;
      }
      $.each($gp.bsgt.bootstrap.breakpoints, function(breakpoint, data){
        var css_var = getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-' + breakpoint); 
        $gp.bsgt.bootstrap.breakpoints[breakpoint] = { width : css_var };
        $gp.bsgt.debug && console.log(
          'Bootstrap ' + $gp.bsgt.bootstrap.version
          + ' CSS variable --breakpoint-' + breakpoint
          + ' = ' + css_var
        );
      });
      break;
   }
};


/* #################################### */
/* #################################### */
/* ############### INIT ############### */
/* #################################### */
/* #################################### */

$(function(){
  $gp.bsgt.init();
});

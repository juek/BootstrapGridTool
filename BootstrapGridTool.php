<?php
/**
 * PHP class for Typesetter CMS plugin Bootstrap Grid Tool
 * Author: J. Krausz
 * Version 0.8a
 * 
 */

defined('is_running') or die('Not an entry point...');

class BootstrapGridTool{

  static $use = 'src'; // 'src'|'dist'

  /**
   * Typesetter action hook
   * 
   */
  public static function GetHead(){
    global $page, $addonRelativeCode;

    // early exit when not logged-in or current page is not editable content
    if( !\gp\tool::LoggedIn() || $page->pagetype != 'display' ){
      return;
    }

    // dynamically load js and css components
    $page->jQueryCode .= "\n/* BootstrapGridTool */\n"
      . '$.getScript("'   . $addonRelativeCode . '/' . self::$use . '/BootstrapGridTool.js");' . "\n"
      . '$gp.LoadStyle("' . $addonRelativeCode . '/' . self::$use . '/BootstrapGridTool.css", true);' . "\n";
  }

}

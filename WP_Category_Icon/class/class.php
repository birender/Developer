<?php

class Category_Class
{
	function __construct()
	{
		add_action('admin_menu', array(&$this,'category_icons')); 
		add_action( 'admin_enqueue_scripts', array(&$this,'load_style') );
	}
	
	function load_style()
	{
		wp_register_style( 'pagenation', PLUGIN_URL .'/css/pagenation.css', false, '1.0.0' );
		
		wp_enqueue_style( 'pagenation' );
	}
	
	function category_icons()
	{
		add_menu_page( "Category Icon", 'Icon4Category','manage_options', __FILE__,  array(&$this,'ShowCatMenu') , PLUGIN_URL.'/images/index.jpg',6 );
		add_submenu_page( __FILE__, 'Add New Icon', 'Add New Icon', 'manage_options', (__FILE__).'_add.new',  array(&$this,'ShowSubCatMenu') );
		add_submenu_page( __FILE__, 'Control Panel', 'Control Panel', 'manage_options', (__FILE__).'_cltpanel',  array(&$this,'ShowSubCatMenuSetting') );
	}
	
	function ShowSubCatMenuSetting()
	{
		if(isset($_POST[save_setting]))
		{
			if(!get_option('icon_path'))
			{
				add_option('icon_path',trim($_POST[path]));
			}
			else
			{
				update_option('icon_path',trim($_POST[path]));
			}
			
			if(!get_option('category_pagenation'))
			{
				add_option('category_pagenation',trim($_POST[Pagenation]));
			}
			else
			{
				update_option('category_pagenation',trim($_POST[Pagenation]));
			}
		}
		
		$page	=	get_option('category_pagenation');
	
	
	?>
		<div class="wrap">
			<div id="icon-options-general" class="icon32">				
			</div>
			<h2>Control Panel</h2>	
			<p></p>
		<form method="post">	
			<table class="form-table">
				<tbody>
					<tr valign="top">
						<th scope="row"><label for="Pagenation">Pagenation</label></th>
						<td>
							<select id="Pagenation" name="Pagenation">
								<option value="10" <?php if($page==10) { _e('selected="selected"');} ?>>10</option>
								<option value="20" <?php if($page==20) { _e('selected="selected"');} ?>>20</option>
								<option value="30" <?php if($page==30) { _e('selected="selected"');} ?>>30</option>
								<option value="40" <?php if($page==40) { _e('selected="selected"');} ?>>40</option>
								<option value="50" <?php if($page==50) { _e('selected="selected"');} ?>>50</option>
							</select>
						</td>
					</tr>
					
					<tr valign="top">
						<th scope="row"><label for="path">Icon Uploaded Folder Path</label></th>
						<td>
							 <input id="path" class="regular-text" type="text" value="<?php _e(get_option('icon_path')); ?>" name="path">
						</td>
					</tr>
					
					<tr valign="top">
						<th scope="row"> <input id="save_setting" class="button-primary" type="submit" value="Save Setting" name="save_setting"></th>
					</tr>
					
				</tbody>
			</table>	
		</form>	
			
		</div>
	<?php 
	}
	
	
	function ShowSubCatMenu()
	{
		?>
		<div class="wrap">
			<div id="icon-upload" class="icon32">				
			</div>
			<h2>Add New Category Icon</h2>	
			<p></p>
			<?php
					global $wpdb;
			
					$qry  = "select * from ".$wpdb->prefix."term_taxonomy inner join ".$wpdb->prefix."terms on ".$wpdb->prefix."term_taxonomy.term_id = ".$wpdb->prefix."terms.term_id and ".$wpdb->prefix."term_taxonomy.taxonomy  ='category' where ".$wpdb->prefix."terms.term_id =".$_GET[term_ID];	
					
					$Result		=	$wpdb->get_results($qry,ARRAY_A);
					
					$dir 	=	"../icon_folder/*.*";

					
			?>
			<form method="post">	
				<table class="form-table">
					<tbody>
						<tr valign="top">
							<th scope="row"><label>Category Name</label></th>
							<td><?php _e(ucfirst($Result[0][name]));?></td>
						</tr>
					
						<tr valign="top">
								<th scope="row"><label for="choose">Choose Icon File</label></th>
							<td>
								<select id="choose" name="choose">
								<?php
									foreach (glob($dir) as $filename)
									{
									?>
										<option value='<?php _e($filename);?>'><?php _e($filename);?></option>
								<?php }?>
								</select>
							</td>
						</tr>
					
						<tr valign="top">
							<th scope="row"> <input id="save_setting" class="button-primary" type="submit" value="Save Setting" name="save_setting">
							</th>
						</tr>
					
				</tbody>
			</table>	
		</form>	
			
		</div>
	<?php 
	}
	
	function ShowCatMenu()
	{
	?>
		<div class="wrap">
			<div id="icon-upload" class="icon32">
				
			</div>
			<h2>Category Icon<h2>
			
			<p></p>
			
				<?php 
					global $wpdb;
					
					$qry  = "select * from ".$wpdb->prefix."term_taxonomy inner join ".$wpdb->prefix."terms on ".$wpdb->prefix."term_taxonomy.term_id = ".$wpdb->prefix."terms.term_id and ".$wpdb->prefix."term_taxonomy.taxonomy  ='category' order by ".$wpdb->prefix."terms.term_id desc";
					
					//$Result		=	$wpdb->get_results($qry,ARRAY_A);
					
					
					$max = 10;


					if(isset($_GET['pg']))
					{
						$p = trim($_GET['pg']);
					}
					else
					{
						$p = 1;
					}

					$limit = ($p - 1) * $max;
					$prev = $p - 1;
					$next = $p + 1;
					$limits = (int)($p - 1) * $max;
					
					$qry 	=	$qry .' limit '.$limits.','.$max.'';
					 
					$Result = $wpdb->get_results($qry,ARRAY_A);

					 
					//Get total records from db
					
					$qryCount = "select count(".$wpdb->prefix."terms.term_id) as tot from ".$wpdb->prefix."term_taxonomy inner join ".$wpdb->prefix."terms on ".$wpdb->prefix."term_taxonomy.term_id = ".$wpdb->prefix."terms.term_id and ".$wpdb->prefix."term_taxonomy.taxonomy  ='category'";
					
					$totalres = mysql_result(mysql_query($qryCount),0);
					 
					$totalposts = ceil($totalres / $max);
					$lpm1 = $totalposts - 1;

					echo  self::pagination($totalposts,$p,$lpm1,$prev,$next);

					//echo '<pre>';print_r($Result);echo '</pre>';
					?>
					<table cellspacing="0" class="widefat">
						<thead>
							<tr>
								<th>ID</th> 
								<th>Category Name</th>
								<th>Icon</th>
								<th>Edit</th>
								<th>Delete Icon</th>
							</tr>
						</thead>	
						<tfoot>
							<tr>
								<th>ID</th> 
								<th>Category Name</th>
								<th>Icon</th>
								<th>Edit</th>
								<th>Delete Icon</th>
							</tr>
						</tfoot>
					<tbody>
		
				<?php
					for($i=0;$i<count($Result);$i++)
					{
					?>
					<tr>
						<td><?php _e($Result[$i][term_id]);?></td>
						<td><?php _e(ucfirst($Result[$i][name]));?></td>
						<td>None</td>
						<td>
							<a href="?page=Category_Icon/class/class.php_add.new&term_ID=<?php _e($Result[$i][term_id]);?>">
								<img src="<?php _e(PLUGIN_URL.'/images/edit.png');?>" alt="Add Icon" title="Add Icon">
							</a>
						</td>
						<td>
							<a href="javascript:void(0);">
								<img src="<?php _e(PLUGIN_URL.'/images/recycle_bin_full2.png');?>" alt ="Delete Icon" title="Delete Icon">
							</a>
						</td>
					</tr>
				<?php }?>
					</tbody>
			</table>	
		</div>
	<?php 
	}//end of category icon list page
	
	function pagination($totalposts,$p,$lpm1,$prev,$next)
	{
		$adjacents = 3;
		
		if($totalposts > 1)
		{
			$pagination .= "<div> <div class='pagenation'>";
	
			if ($p > 1)
			$pagination.= "<a href=\"?page=Category_Icon/class/class.php&pg=$prev\"><< Previous</a> ";
			else
			$pagination.= "<span class=\"disabled\"><< Previous</span> ";
			if ($totalposts < 7 + ($adjacents * 2)){
				for ($counter = 1; $counter <= $totalposts; $counter++){
					if ($counter == $p)
					$pagination.= "<span class=\"current\">$counter</span>";
					else
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$counter\">$counter</a> ";}
			}elseif($totalposts > 5 + ($adjacents * 2)){
				if($p < 1 + ($adjacents * 2)){
					for ($counter = 1; $counter < 4 + ($adjacents * 2); $counter++){
						if ($counter == $p)
						$pagination.= " <span class=\"current\">$counter</span> ";
						else
						$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$counter\">$counter</a> ";
					}
					$pagination.= " ... ";
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$lpm1\">$lpm1</a> ";
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$totalposts\">$totalposts</a> ";
				}
				//in middle; hide some front and some back
				elseif($totalposts - ($adjacents * 2) > $p && $p > ($adjacents * 2)){
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=1\">1</a> ";
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=2\">2</a> ";
					$pagination.= " ... ";
					for ($counter = $p - $adjacents; $counter <= $p + $adjacents; $counter++){
						if ($counter == $p)
						$pagination.= " <span class=\"current\">$counter</span> ";
						else
						$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$counter\">$counter</a> ";
					}
					$pagination.= " ... ";
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$lpm1\">$lpm1</a> ";
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$totalposts\">$totalposts</a> ";
				}else{
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=1\">1</a> ";
					$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=2\">2</a> ";
					$pagination.= " ... ";
					for ($counter = $totalposts - (2 + ($adjacents * 2)); $counter <= $totalposts; $counter++){
						if ($counter == $p)
						$pagination.= " <span class=\"current\">$counter</span> ";
						else
						$pagination.= " <a href=\"?pg=$counter\">$counter</a> ";
					}
				}
			}
			if ($p < $counter - 1)
			$pagination.= " <a href=\"?page=Category_Icon/class/class.php&pg=$next\">Next >></a>";
			else
			$pagination.= " <span class=\"disabled\">Next >></span>";
			$pagination.= "</div>\n";
			}
		return $pagination;
	}	//end of pagenation
}//end of class


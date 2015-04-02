(function(){
//Section 1 : Code to execute when the toolbar button is pressed
	var a= {
		exec:function(editor){
			var now = new Date();
			editor.insertHtml( 'The current date and time is: <em>' + now.toString() + '</em>' );
		}
	},
//Section 2 : Create the button and add the functionality to it
	b='custombutton';
	CKEDITOR.plugins.add(b,{
		init:function(editor){
		editor.addCommand(b,a);
		editor.ui.addButton('custombutton',{
				label:'Custom Button',
				icon: this.path + 'logo_ckeditor.png',				
				command:b
			});
		}
	});
})();
#!/usr/bin/perl

# Get directory
my $dir;
BEGIN {
	$dir = $0;
	$dir =~ s/[^\/]*$//g;
	if(!$dir){ $dir = "./"; }
	$lib = $dir."lib/";
}
use lib $lib;
use utf8;
use warnings;
use strict;
use Data::Dumper;
use POSIX qw(strftime);
use JSON::PP;
use OpenInnovations::NPG;

# Define input files
my $file_scenario = $dir."scenarios.json";
my $file_colours = $dir."colours.csv";
my $file_index = $dir."graphs/index.json";

# Define output file
my $file_html = $dir."../graphs.html";

my $indent = "";

# Define variables
my (@lines,%scenarios,@cols,$line,$scenario,@graphs,$html,$tabs,$toc,$figs,$i,$graph,$svg,@sections,$section,$s,$str,$fig,$table,$slug,$num,$count);

# Get the scenario config
msg("Reading scenarios from <cyan>$file_scenario<none>\n");
open(FILE,$file_scenario);
binmode(FILE, ':utf8');
@lines = <FILE>;
close(FILE);
%scenarios = %{JSON::PP->new->utf8->decode(join("\n",@lines))};
msgIndent(1);
foreach $scenario (keys(%scenarios)){
	msg("$scenario: ".($scenarios{$scenario}{'color'}||"")." / ".($scenarios{$scenario}{'css'}||"")."\n");
}

# Load in the extra colour definitions
msgIndent(0);
msg("Reading colours from <cyan>$file_colours<none>\n");
open(FILE,$file_colours);
binmode(FILE, ':utf8');
@lines = <FILE>;
close(FILE);
foreach $line  (@lines){
	$line =~ s/[\n\r]//g;
	(@cols) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
	if($cols[0]){
		$scenarios{$cols[0]} = ();
		$scenarios{$cols[0]}{'color'} = $cols[1];
	}
}



if(-e $file_index){
	msg("Read in graph definitions from <cyan>$file_index<none>\n");
	# Get the graph config
	open(FILE,$file_index);
	binmode(FILE, ':utf8');
	@lines = <FILE>;
	close(FILE);
	@sections = @{JSON::PP->new->utf8->decode(join("\n",@lines))};

	# Create the SVG output
	$graph = OpenInnovations::NPG->new();
	$graph->setScenarios(%scenarios);
	$html = "";
	$tabs = "";


	$fig = 1;

	for($s = 0; $s < @sections; $s++){
		msgIndent(0);
		msg("Section: <green>".($sections[$s]->{'title'}||"")."<none>\n");

		$slug = $sections[$s]->{'slug'} || "";
		$num = sprintf("%02d", $s + 1);
		@graphs = @{$sections[$s]->{'graphs'}};
		$count = scalar @graphs;

		$tabs .= "    <button class=\"g-tab".($s == 0 ? " active" : "")."\" data-tab=\"$slug\" type=\"button\">\n";
		$tabs .= "     <span class=\"g-tab-num\">$num</span>\n";
		$tabs .= "     <span class=\"g-tab-label\">".($sections[$s]->{'title'}||"")."</span>\n";
		$tabs .= "     <span class=\"g-tab-count\">$count</span>\n";
		$tabs .= "   </button>\n";

		$html .= "  <section class=\"g-panel".($s == 0 ? " active" : "")."\" data-panel=\"$slug\" id=\"panel-$slug\">\n";
		$html .= "    <div class=\"holder\">\n";
		$html .= "      <header class=\"g-section-head\">\n";
		$html .= "        <div class=\"g-section-eyebrow\">Section $num</div>\n";
		$html .= "        <h2 class=\"g-section-title\">".($sections[$s]->{'title'}||"")."</h2>\n";
		$html .= "        <p class=\"g-section-lede\">$count graphs &middot; downloadable as SVG and CSV</p>\n";
		$html .= "      </header>\n";

		$toc = "";
		$figs = "";
		msgIndent(1);

		for($i = 0; $i < (@graphs); $i++,$fig++){
			msg("Figure <yellow>$fig<none>: <cyan>".$dir."graphs/$graphs[$i]{'csv'}<none>\n");
			$graph->load($dir.'graphs/'.$graphs[$i]{'csv'})->process();
			
			# If we have a y-axis scaling we scale the values
			if($graphs[$i]{'yscale'}){
				$graph->scaleY($graphs[$i]{'yscale'});
			}
			$table = $graph->table(());
			
			# Output the SVG
			$svg = $graph->draw((
				'yaxis-label'=>$graphs[$i]{'yaxis-label'},
				'yscale'=>$graphs[$i]{'yscale'},
				'yaxis-max'=>$graphs[$i]{'yaxis-max'},
				'width'=>'640',
				'xaxis-max'=>2051,
				'xaxis-line'=>1,
				'stroke'=>3,
				'strokehover'=>5,
				'point'=>4,
				'pointhover'=>6,
				'line'=>2,
				'yaxis-format'=>"commify",
				'yaxis-labels-baseline'=>'middle',
				'xaxis-ticks'=>1,
				'left'=>$graphs[$i]{'left'},
				'tooltip'=>$graphs[$i]{'tooltip'}
			));
			open(FILE,'>',$dir.'graphs/'.$graphs[$i]{'svg'});
			binmode(FILE, ':utf8');
			print FILE $svg;
			close(FILE);

			# Set whitespace for HTML
			$svg =~ s/\n/\n\t\t\t\t\t/g;
			$table =~ s/\n/\n\t\t\t\t/g;

			$toc .= "<a href=\"#figure-$fig\" class=\"g-mini-toc-item\"><span>$fig</span> $graphs[$i]{'title'}</a>\n";

			$figs .= "<article class=\"g-figure\" id=\"figure-$fig\" data-fig-num=\"$fig\">\n";
			$figs .= "      <header class=\"g-figure-head\">\n";
			$figs .= "        <div class=\"g-figure-num\">Figure $fig</div>\n";
			$figs .= "        <h3 class=\"g-figure-title\">$graphs[$i]{'title'}</h3>\n";
			$figs .= "      </header>\n";
			$figs .= "      <div class=\"g-figure-body\">\n";
			$figs .= "        <figure>\n";
			$figs .= "\t\t\t\t<figcaption><strong>Figure ".($fig).":</strong> $graphs[$i]{'title'}</figcaption>\n";
			$figs .= "\t\t\t\t<div class=\"table-holder\">\n";
			$figs .= "\t\t\t\t".$table;
			$figs .= "</div>\n";
			$figs .= "\t\t\t\t<div class=\"oi-viz oi-chart oi-chart-line\">\n";
			$figs .= "\t\t\t\t\t<a id=\"pre-fig-$fig\" href=\"#post-fig-$fig\" class=\"skip-link button\">Skip chart</a>\n";
			$figs .= "\t\t\t\t\t$svg\n";
			$figs .= "\t\t\t\t\t<a id=\"post-fig-$fig\" href=\"#pre-fig-$fig\" class=\"skip-link skip-link-bottom button\">Go to start of chart</a>\n";
			$figs .= "\t\t\t\t</div>\n";
			$figs .= "\t\t\t\t<div class=\"download\">\n";
			$figs .= "\t\t\t\t\t<a href=\"data/graphs/$graphs[$i]{'svg'}\"><img src=\"resources/download.svg\" alt=\"download\" title=\"Download graph from Figure $fig\" /> SVG</a>\n";
			$figs .= "\t\t\t\t\t<a href=\"data/graphs/$graphs[$i]{'csv'}\"><img src=\"resources/download.svg\" alt=\"download\" title=\"Download data from Figure $fig\" /> CSV</a>\n";
			$figs .= "\t\t\t\t</div>\n";
			$figs .= "        </figure>\n";
			$figs .= "      </div>\n";
			$figs .= "    </article>\n";

		}

		$html .= "      <nav class=\"g-mini-toc\" aria-label=\"".($sections[$s]->{'title'}||"")." graphs\">\n";
		$html .= $toc;
		$html .= "      </nav>\n";
		$html .= "      <div class=\"g-figures\">\n";
		$html .= $figs;
		$html .= "      </div>\n";
		$html .= "    </div>\n";
		$html .= "  </section>\n";
	}

	open(FILE,$file_html);
	binmode(FILE, ':utf8');
	@lines = <FILE>;
	close(FILE);
	$str = join("",@lines);
	$str =~ s/(<!-- START TABS -->)(.*?)(<!-- END TABS -->)/$1\n$tabs    $3/s
		or die "<!-- START TABS --> / <!-- END TABS --> markers missing in $file_html\n";
	$str =~ s/(<!-- START GRAPHS -->)(.*?)(<!-- END GRAPHS -->)/$1\n$html  $3/s
		or die "<!-- START GRAPHS --> / <!-- END GRAPHS --> markers missing in $file_html\n";

	msg("Save result in <cyan>$file_html<none>\n");
	open(FILE,">",$file_html);
	binmode(FILE, ':utf8');
	print FILE $str;
	close(FILE);

}else{
	error("Unable to read graph definitions from <cyan>$file_index<none>\n");
}




#####################
# Subroutines

sub msgIndent {
	$indent = "\t" x shift;
}

sub msg {
	my $str = $_[0];
	my $dest = $_[1]||"STDOUT";
	
	my %colours = (
		'black'=>"\033[0;30m",
		'red'=>"\033[0;31m",
		'green'=>"\033[0;32m",
		'yellow'=>"\033[0;33m",
		'blue'=>"\033[0;34m",
		'magenta'=>"\033[0;35m",
		'cyan'=>"\033[0;36m",
		'lightgrey'=>"\033[0;37m",
		'grey'=>"\033[0;90m",
		'lightred'=>"\033[0;91m",
		'lightgreen'=>"\033[0;92m",
		'lightyellow'=>"\033[0;93m",
		'lightblue'=>"\033[0;94m",
		'lightmagenta'=>"\033[0;95m",
		'lightcyan'=>"\033[0;96m",
		'white'=>"\033[0;97m",
		'none'=>"\033[0m"
	);
	foreach my $c (keys(%colours)){ $str =~ s/\< ?$c ?\>/$colours{$c}/g; }
	$str =~ s/\n(.+)/\n$indent$1/g;
	if($dest eq "STDERR"){
		print STDERR $indent.$str;
	}else{
		print STDOUT $indent.$str;
	}
}

sub error {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1<red>ERROR:<none> /;
	msg($str,"STDERR");
}

sub warning {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1<yellow>WARNING:<none> /;
	msg($str,"STDERR");
}



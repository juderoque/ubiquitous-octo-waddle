<?php 
	$file="chatlogs.csv";
	$purpose = $_POST['purpose'];
	if($purpose == 'send')
	{
		$fh=fopen($file, 'a');
		$userid = $_POST['userid'];
		$msgid = $_POST['msgid'];
		$message = $_POST['message'];
		if($message != '')
		{
			$data = $userid."`".$msgid."`".$message."\n";
			fwrite($fh, $data);
			fclose($fh);
		}
		echo(json_encode($msgid));
	}
	elseif($purpose == 'update')
	{
		$fh = fopen($file, 'r');
		$result = "";
		while(!feof($fh))
		{
		/*	$linenum = (preg_split("/,/",$line)[1] + 0);
			$line = fgets($fh);
			if($linenum > $newest)
			{*/
			$result = $result.$line;
			$line = fgets($fh);
		//	}
		//	echo "<script language='javascript'>alert(line number ".$linenum." newest ".$newest.");</script>";
		}
		/*
		while(!feof($fh))
		{
			$line = fgets($fh);
			$result = $result.$line;
			echo "hi javascript! we are adding line ".$line."to result. love php";
		}*/
		echo(json_encode($result));	
	}
	else
	{
		echo '<script language="javascript">alert("either something is broken or you are trying to hack me :(");</script>';
	}
?>

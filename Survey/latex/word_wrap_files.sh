#!/bin/bash

if [ "$#" -lt 2 ]; then
    echo "Illegal number of parameters. Correct use is ./word_wrap_files.sh <format> <inFolder> <optional:exclude 1 filename>"
else
	for i in $2/*.$1
	do
		if [ "$#" -gt 2 ] && [ "${i/$3.}" = "$i" ] ; then
			fold -s $i > $i.output
			mv $i.output $i
			echo "word-wrapped $i"
		else
			echo "$3.$1 was found as $i. $i is excluded from the word-wraping"
		fi

	done
fi

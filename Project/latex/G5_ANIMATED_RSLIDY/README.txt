
Carry out the following steps:


1. Ensure that LaTeX2e, biblatex, and biber are installed on your system
   and pdflatex and biber are in your path.

   For Windows, I use cygwin and TexLive 2016 (ISO image):

     http://mirror.ctan.org/systems/texlive/Images/

   The ISO image contains versions for Windows, Mac, and Linux.
   Under Windows 10, an ISO image can be mounted by double-clicking.



2. Upgrade to the most recent versions of biblatex and biber.
   I use biblatex 3.6 and biber 2.6.

   With TexLive you can use the TexLive Manager GUI to update
   packages online from a nearby CTAN mirror.

   [The default CTAN mirror for Austria is hosted by easyname.at.
    I usually load an alternative repository from Germany, such
    as the one at sunsite.informatik.rwth-aachen.de]



3. Set the following environment variables:

   setenv TEXINPUTS .:~/tex/inputs:./inputs::
   setenv BSTINPUTS .:~/tex/inputs::
   setenv BIBINPUTS .:~/tex/bib:./bib::



4. Compile the PDF with the following sequence of commands

   pdflatex survey
   biber survey
   pdflatex survey
   pdflatex survey


  Alternatively, you can use the latexmk perl script:

   latexmk --pdf survey



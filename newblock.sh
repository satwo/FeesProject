#!/bin/bash
(
  # Wait for lock on /var/lock/.myscript.exclusivelock (fd 200) for 10 seconds
  flock -x -w 10 200 || exit 1

  python "getfeehistory.py"

) 200>/var/lock/.myscript.exclusivelock
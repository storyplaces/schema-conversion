#!/usr/bin/env node

/*! *****************************************************************************
 *
 * StoryPlaces
 *

 This application was developed as part of the Leverhulme Trust funded
 StoryPlaces Project. For more information, please visit storyplaces.soton.ac.uk

 Copyright (c) $today.year
 University of Southampton
 Charlie Hargood, cah07r.ecs.soton.ac.uk
 Kevin Puplett, k.e.puplett.soton.ac.uk
 David Pepper, d.pepper.soton.ac.uk

 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 * The name of the Universities of Southampton nor the name of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL THE ABOVE COPYRIGHT HOLDERS BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 ***************************************************************************** */

"use strict";

import * as program from 'commander';
import {File}from './File';

import {core} from "./schemaUpgraders/core";

let filename = processCommandLine();

console.error("Beginning program...");

getFile(filename)
    .then(contents => {
        if(typeof contents === "string") {
          let data = JSON.parse(contents);
          let validate = true;
          let result = new core().upgradeSchema(data, validate);

          outputResult(result);
        }
        console.error("Error given invalid data - Should totally fix in Typescript");

    }, error => {
        console.error(error);
    })
    .catch(error => {
        console.error(error);
    });


/* End of code */

function outputResult(result) {
    let contents = JSON.stringify(result, null, 2);

    if (program.outfile) {
        File.createFile(program.outfile, contents);
        return;
    }

    console.log(contents);
}

function getFile(filename) {
    if (filename) {
        return getRealFile(filename);
    }

    return getStdIn();
}

function processCommandLine() {
    let fn = undefined;
    program
        .version('0.0.1')
        .arguments('<file>')
        .option('-s, --stdin', 'Read from STD_IN')
        .option('-o, --outfile [value]', 'Output to file rather than STD_OUT')
        .action(file => {
            fn = file;
        })
        .parse(process.argv);
    return fn;
}


function getRealFile(filename) {
    return new Promise((resolve, reject) => {
        try {
            filename = File.getFullFileName(filename);
        } catch (e) {
            reject(Error("Can't open file: " + filename));
        }

        if (!File.fileExistsAndIsReadable(filename)) {
            reject(Error("Can't open file: " + filename));
        }

        resolve(File.readFileContents(filename));
    });
}

function getStdIn() {

    if (!program.stdin) {
        program.help();
    }

    return new Promise((resolve, reject) => {
        let chunks = [];
        process.stdin.on('data', chunk => {
            chunks.push(chunk);
        });

        process.stdin.on('end', () => {
            resolve(chunks.join(''));
        });

        process.stdin.on('error', (err) => {
            reject(err);
        })
    });
}

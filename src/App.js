import React, {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import ReactPlayer from "react-player";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import {CardActionArea, CardMedia} from "@material-ui/core";
import Card from "@material-ui/core/Card";
import { makeStyles, createStyles } from '@material-ui/core/styles';
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import {Duration} from "./Duration";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        marginTop: theme.spacing(1)
    },
    media: {
        paddingTop: '56.25%',
        height: 0
    },
    mediaList: {
        overflow: "scroll"
    },
    mediaListWrapper: {
        padding: theme.spacing(1)
    }
}));


function App(callback, deps) {
    const classes = useStyles();

    const [playerHeight, setPlayerHeight] = useState(480);
    const [movieIndex, setMovieIndex] = useState(-1);
    const [movies, setMovies] = useState([]);
    const [movie, setMovie] = useState({});
    const [movieItemInfos, setMovieItemInfos] = useState({});
    const [showItems, setShowItems] = useState([]);
    const [stackInfos, setStackInfos] = useState(null);
    const [nowSeek, setSeek] = useState(0);

    const normalizeItemInfo = useCallback((movie) => {
        const timedItems = {};
        (movie.items||[]).forEach(item => {
            const firstTime = item.times[0] || {};
            (item.times||[]).forEach(time => {
                for(let i = time.start, l = time.end; i <= l; i += 1) {
                    let data = timedItems["time" + i] || [];
                    item.jumpTo = item.jumpTo || firstTime.start;
                    item.appendTime = firstTime.end + 1;
                    data.push(item);
                    timedItems["time" + i] = data;
                }
            });
        });
        return timedItems;
    }, []);

    const movieChangeHandler = useCallback((event) => {
        setMovieIndex(event.target.value);
        const movie = movies[event.target.value] || {};
        setMovieItemInfos(normalizeItemInfo(movie));
        setMovie(movie);
    }, [movies, normalizeItemInfo]);

    const seekHandler = useCallback((e) => {
        const nowSecond = Math.floor(e.playedSeconds);
        setSeek(nowSecond);
        setShowItems(movieItemInfos["time" + nowSecond]);

        const base = JSON.stringify(stackInfos || {}), obj = JSON.parse(base);
        (movieItemInfos['time' + (nowSecond - 1)] || []).forEach(v => {
            if (nowSecond === v.appendTime) {
                obj[v.key] = v;
            }
        });
        if (JSON.stringify(obj) !== base) {
            setStackInfos(obj);
        }
    }, [movieItemInfos, stackInfos]);

    const player = useRef();

    const playMovieHandler = useCallback(e => {
        if (!stackInfos) {
            return ;
        }
        const obj = {}, nowSeek = player.current.getCurrentTime();
        for (let i = 0; i <= nowSeek;i++) {
            if (typeof movieItemInfos['time' + i] === "object") {
                movieItemInfos['time' + i].forEach(v => {
                    obj[v.key] = v;
                });
            }
        }
        setStackInfos(obj);
    }, [movieItemInfos, stackInfos]);

    const movieItemClickHandler = useCallback((key) => {
        return () => player.current.player.seekTo(stackInfos[key].jumpTo);
    }, [stackInfos]);


    useEffect(() => {
        const makePlayerHeight = () => {
            const style = window.getComputedStyle(document.getElementById("playerContainer"));
            setPlayerHeight(parseInt(style.width) * 0.5625);
        }
        makePlayerHeight();

        window.addEventListener('resize', () => {
            makePlayerHeight();
        });

        fetch('./jsons/definitions.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error();
                }
                return response.json();
            }).then(json => {
                setMovies(json);
            }).catch(error => {
                console.log(error);
            });
    }, []);

    return (
        <Container className={classes.root}>
            <Grid container spacing={1} direction={"column"}>
                <Grid item>
                    <FormControl fullWidth className={classes.formControl}>
                        <InputLabel id="movie-list">動画リスト</InputLabel>
                        <Select
                            fullWidth
                            labelId="movie-list"
                            id="movie-list-select"
                            value={movieIndex}
                            onChange={movieChangeHandler}
                        >{movies.map((movie, index) => <MenuItem value={index} key={movie.index}>{movie.title}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item>
                    <Grid container direction={"row"} spacing={2}>
                        <Grid item xs={9} id={"playerContainer"}>
                            <ReactPlayer width={"100%"} height={playerHeight} ref={player}
                                         url={movie.url} onProgress={seekHandler} progressInterval={250} controls={true}
                                         playing={true} onPlay={playMovieHandler}
                            />
                            <div>
                                <Duration seconds={nowSeek} />
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            {(showItems||[]).map(showItem => {
                                return (
                                    <Card key={showItem.key}>
                                        <CardMedia image={showItem.image} title={showItem.name} className={classes.media} />
                                    </Card>
                                );
                            })}
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item className={classes.mediaListWrapper}>
                    <Grid container spacing={2} direction={"row"} className={classes.mediaList}>
                        {(Object.values(stackInfos || {})).map((data) => (
                            <Card key={data.key}>
                                <CardActionArea onClick={movieItemClickHandler(data.key)}>
                                    <img src={data.image} alt={data.name} className={classes.mediaListImage} />
                                </CardActionArea>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
}

export default App;

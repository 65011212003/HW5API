import express, { Application, Request, Response } from 'express';
import mysql, { OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const app: Application = express();
const port = 3000;

const pool = mysql.createPool({
    host: 'mysql-3c6b224c-msu-5de2.a.aivencloud.com',
    port: 11380,
    user: 'avnadmin',
    password: 'AVNS_s_xng1w3lBmSFCP7FML',
    database: 'defaultdb',
    connectionLimit: 10,
});

app.use(express.json());

// Get all people
app.get('/api/people', async (req: Request, res: Response) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM People');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Create a new person
app.post('/api/people', async (req: Request, res: Response) => {
    try {
        const { first_name, last_name } = req.body;

        // Check if both first_name and last_name are provided
        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'Both first_name and last_name are required' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO People (first_name, last_name) VALUES (?, ?)', [first_name, last_name]);
        connection.release();

        // Check if the insert was successful
        if ((result as OkPacket).affectedRows === 1) {
            res.status(201).json({ message: 'Person added successfully' });
        } else {
            res.status(500).json({ error: 'Failed to insert person' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update a person by ID
app.put('/api/people/:id', async (req: Request, res: Response) => {
    const personId = req.params.id;
    const { first_name, last_name } = req.body;

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query<OkPacket>('UPDATE People SET first_name = ?, last_name = ? WHERE id = ?', [first_name, last_name, personId]);
        connection.release();

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Person not found' });
        } else {
            res.json({ id: parseInt(personId), first_name, last_name });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a person by ID
app.delete('/api/people/:id', async (req: Request, res: Response) => {
    const personId = req.params.id;

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query<OkPacket>('DELETE FROM People WHERE id = ?', [personId]);
        connection.release();

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Person not found' });
        } else {
            res.json({ message: 'Person deleted successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ...

// Create
app.post('/api/movies', async (req: Request, res: Response) => {
    try {
        const { title, release_year, description } = req.body;

        // Check if required fields are provided
        if (!title || !release_year) {
            return res.status(400).json({ error: 'Both title and release_year are required' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO Movies (title, release_year, description) VALUES (?, ?, ?)', [title, release_year, description]);
        connection.release();

        if ((result as OkPacket).affectedRows === 1) {
            res.status(201).json({ message: 'Movie added successfully' });
        } else {
            res.status(500).json({ error: 'Failed to insert movie' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Read
app.get('/api/movies', async (req: Request, res: Response) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM Movies');
        connection.release();

        if (Array.isArray(rows)) {
            res.json(rows);
        } else {
            console.error('Unexpected result format for SELECT query');
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update
app.put('/api/movies/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, release_year, description } = req.body;

        const connection = await pool.getConnection();
        const [result] = await connection.query('UPDATE Movies SET title = ?, release_year = ?, description = ? WHERE id = ?', [title, release_year, description, id]);
        connection.release();

        if ((result as OkPacket).affectedRows === 1) {
            res.json({ message: 'Movie updated successfully' });
        } else {
            res.status(404).json({ error: 'Movie not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete
app.delete('/api/movies/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const connection = await pool.getConnection();
        const [result] = await connection.query('DELETE FROM Movies WHERE id = ?', [id]);
        connection.release();

        if ((result as OkPacket).affectedRows === 1) {
            res.json({ message: 'Movie deleted successfully' });
        } else {
            res.status(404).json({ error: 'Movie not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ...

// ...

// Get movies by actor name
app.get('/api/movies-by-actor/:actorName', async (req: Request, res: Response) => {
    try {
        const { actorName } = req.params;

        const connection = await pool.getConnection();
        const [rows] = await connection.query(`
            SELECT Movies.title, Movies.release_year, Movies.description
            FROM Movies
            INNER JOIN Stars ON Movies.id = Stars.movie_id
            INNER JOIN People ON Stars.person_id = People.id
            WHERE People.first_name = ? OR People.last_name = ?
        `, [actorName, actorName]);

        connection.release();

        if (Array.isArray(rows)) {
            res.json(rows);
        } else {
            console.error('Unexpected result format for SELECT query');
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ...

// ...

// Search for a movie by name
app.get('/api/search-movie/:movieName', async (req: Request, res: Response) => {
    try {
        const { movieName } = req.params;

        const connection = await pool.getConnection();
        const [rows] = await connection.query(`
            SELECT Movies.id, Movies.title, Movies.release_year, Movies.description,
            GROUP_CONCAT(CONCAT(People.first_name, ' ', People.last_name) SEPARATOR ', ') as actors
            FROM Movies
            LEFT JOIN Stars ON Movies.id = Stars.movie_id
            LEFT JOIN People ON Stars.person_id = People.id
            WHERE Movies.title LIKE ?
            GROUP BY Movies.id
        `, [`%${movieName}%`]);

        connection.release();

        if (Array.isArray(rows) && rows.length > 0) {
            const movieDetails = rows[0];
            res.json(movieDetails);
        } else {
            res.status(404).json({ error: 'Movie not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ...


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
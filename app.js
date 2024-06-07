const express = require("express")
const app = express()
const handlebars = require("express-handlebars").engine
const bodyParser = require("body-parser")
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')

const serviceAccount = require('./node-firebase-d3d20-firebase-adminsdk-38dgp-55cb796a71.json')

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

app.engine("handlebars", handlebars({defaultLayout: "main"}))
app.set("view engine", "handlebars")


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get("/", function(req, res){
    res.render("primeira_pagina")
})

app.get("/consulta", async function(req, res){
    const dataSnapshot = await db.collection('agendamentos').get();
    const data = [];
    if (dataSnapshot.empty) {
        console.log('No matching documents.');
        return res.redirect("/");
        
    }  

    dataSnapshot.forEach((doc) => {
        data.push({
            id: doc.id,
            nome: doc.get('nome'),
            telefone: doc.get('telefone'),
            origem: doc.get('origem'),
            data_contato: doc.get('data_contato'),
            observacao: doc.get('observacao'),
        })
    });
    res.render("consulta", { data });
})

app.get("/editar/:id", async function(req, res){
    try {
        const docRef = db.collection('agendamentos').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.log('No matching documents.');
            res.status(404).send('No matching documents.');
            
        }else{

        const agendamento = doc.data();
        console.log('Document data:', agendamento);
        res.render("editar", {id: req.params.id, agendamento:doc.data()});
        }
    } catch (error) {
        console.log("Error getting document: ", error);
        res.status(500).send('Error getting document');
    }
});

app.post("/atualizar", async function(req, res) {
    const id = req.body.id;
    const agendamento = {
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    };

    try {
        const docRef = db.collection('agendamentos').doc(id);
        await docRef.update(agendamento);

        console.log('Documento atualizado com sucesso:', agendamento);
        res.redirect('/consulta');
    } catch (error) {
        console.log("Erro ao atualizar o documento: ", error);
        res.status(500).send('Erro ao atualizar o documento');
    }
});



app.get("/excluir/:id", async function(req, res) {
    try {
        const docRef = db.collection('agendamentos').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            console.log('No matching documents.');
            res.status(404).send('No matching documents.');
            return;
        }

        await docRef.delete();
        console.log('Document successfully deleted');
        res.redirect("/consulta");
    } catch (error) {
        console.log("Error deleting document: ", error);
        res.status(500).send('Error deleting document');
    }
});


app.post("/cadastrar", function(req, res){
    var result = db.collection('agendamentos').add({
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    }).then(function(){
        console.log('Added document');
        res.redirect('/')
    })
})

app.listen(8081, function(){
    console.log("Servidor ativo!")
})
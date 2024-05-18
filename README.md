# MISIS Dark Horse

Классификация парнокопытных

## Описание задачи

На основе представленных данных, сформированных датасетов и материалов из открытых источников обучить нейросеть отличать вид (подвид) оленя друг от друга, а также сформировать интерфейс загрузки данных и представления результатов распознавания с учетом требования по автономности решения (без использования сети «Интернет»).

Задача - автоматизировать работу научного сотрудника, который сейчас занимается детекцией и классификацией собственноручно.

# Наше решение

Мы представляем приложение для классификации трёх видов парнокопытных, которое будет доступно для пользования на любой операционной системе (Windows, Lunix, macOS) без подключения к сети Интернет.
Для получения наилучшей точности задача классификации была разбита на два этапа - **детекция** с помощью моделей из Ultralytics, дальшейшая **классификация** путём ансамблирования свёрточной нейронной сети и трансформера.
Модели были обучены на предварительно **очищенных, размеченных и расширенных данных (аугментации).**
Были использованы только общедоступные библиотеки.
Версии моделей были подобраны максимально оптимально в соотношении время работы/качество.
Наш продукт будет помогать работникам министерства природных ресурсов и экологии, заповедников, ферм.

# Работа с данными

В самом начале мы очистили датасет от некорректных данных и разметили 3500 фотографий. На размеченных данных была обучена модель детекции **YOLOv8**. Обученная модель позволила получить новый датасет обрезанных фотографий животных для лучшей точности следующих моделей.

# Архитектура модели

В качестве моделей для классификации были выбраны: **ResNet152, Vit (visinon transformer), EfficientNet-b5**. #TOWRITE: как происходит ансамблирование

# обучение Ml моделей

[Yolov8](./ML/yolov8.ipynb)

[Resnet & EfficientNet](./ML/ResNet_EfficientNet.ipynb)

[Vit (visinon transformer)](./ML/Vit.ipynb)

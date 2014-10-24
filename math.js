Math.sum = function(array) {
	var count = array.length, 
		total = 0, 
		i = 0;
	while (i < count)	total+= array[i++];	 
	return total;
}
Math.average = function(array) {
	var count = array.length, 
		total = 0, 
		i = 0;
	while (i < count) total+= array[i++];
	return total / count;
}

/* population variance */
Math.variance = function(array, average) {
	if (average===undefined) average = Math.average(array);
	var count = array.length, 
		total = 0, 
		i = 0;
	while (i < count) total+= Math.pow((array[i++] - average), 2)/count;

	return total;
}

/* population covariance */
Math.covariance = function(array1, array2, average1, average2) {
	if (average1===undefined) average1 = Math.average(array1);
	if (average2===undefined) average2 = Math.average(array2);
	var count = array1.length, 
		total = 0, 
		i = 0;
	while (i < count){
		total+= (array1[i] - average1) * (array2[i] - average2)/count;
		i++;
	} 

	return total;
}